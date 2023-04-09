import time

from rich.console import Console
from rich.theme import Theme

from algosdk.v2client import algod
from algosdk.future import transaction
from algosdk import encoding, constants

from .accounts import get_accounts
from .escrow import EscrowAccount
from .helpers import compile_contract, wait_for_transaction, read_user_local_state_for_app, read_global_state
from .crowdfund_contract import FundingProject

ACCOUNT_NAMES = ['platform', 'creator', 'doner']
ALGOD_ADDRESS = "http://localhost:4001"
ALGOD_TOKEN = "your-address-here"

CROWDFUND_CONTRACT = FundingProject()
ESCROW_ACCOUNT = EscrowAccount()

CUSTOM_THEME = Theme({
    "info": "dim cyan",
    "warning": "magenta",
    "danger": "bold red"
})

MIN_BALANCE = 100_000
FEE_ON_SPONSORSHIP = 50_000

class DemoApp():
    def __init__(self, goal_in_microAlgos=1000000):
        self.accounts = {name: acc for name, acc in zip(ACCOUNT_NAMES, get_accounts())}
        self.client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        self.crowdfund_approval = compile_contract(CROWDFUND_CONTRACT.approval_program(), self.client)
        self.crowdfund_clear = compile_contract(CROWDFUND_CONTRACT.clear_program(), self.client)
        self.console = Console(theme=CUSTOM_THEME)
        self.goal = goal_in_microAlgos
        self.escrow = None
        self.is_online = False

    def __start_crowdfunding(self, creator, app_args=[], is_sponsored=True):
        # declare application state storage (immutable)
        local_ints = 1
        local_bytes = 1
        global_ints = (
            5  # the current_amount, goal_amount, + two more (later will be the dates)
        )
        global_bytes = 7 # free bytes for anything else
        globalSchema = transaction.StateSchema(global_ints, global_bytes)
        localSchema = transaction.StateSchema(local_ints, local_bytes)

        txn = transaction.ApplicationCreateTxn(
        sender=creator.address,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=self.crowdfund_approval,
        clear_program=self.crowdfund_clear,
        global_schema=globalSchema,
        local_schema=localSchema,
        app_args=app_args,
        sp=self.client.suggested_params(),
        )
        if not is_sponsored:
            signed_txn = txn.sign(creator.private_key)
            txn_id = signed_txn.transaction.get_txid()

            self.client.send_transaction(signed_txn)
        else:
            fee_txn = transaction.PaymentTxn(
                sender=creator.address,
                receiver=self.accounts['platform'].address,
                amt=FEE_ON_SPONSORSHIP,
                sp=self.client.suggested_params()
                )

            transaction.assign_group_id([txn, fee_txn])
            signed_txn = txn.sign(creator.private_key)
            signed_fee_txn = fee_txn.sign(creator.private_key)
            txn_id = signed_fee_txn.transaction.get_txid()
            self.client.send_transactions([signed_txn, signed_fee_txn])

        app_id = wait_for_transaction(self.client, txn_id)
        if app_id is not None:
            self.console.print("Created new app-id:", app_id, style='info')
            self.app_id = app_id
            self.is_online = True
        else:
            self.console.print('Transaction timed out, exiting..', style='danger')
            exit()

    def __deploy_escrow_and_update_app(self, creator):
        escrow_program = compile_contract(ESCROW_ACCOUNT.create_account(self.app_id), self.client, is_app=False)
        self.escrow = transaction.LogicSigAccount(escrow_program)

        app_args = [encoding.decode_address(self.escrow.address())]
        sp = self.client.suggested_params()

        txn = transaction.ApplicationUpdateTxn(
            sender=creator.address,
            index=self.app_id,
            approval_program=self.crowdfund_approval,
            clear_program=self.crowdfund_clear,
            app_args=app_args,
            sp=sp
            )
        fund_escrow_txn = transaction.PaymentTxn(
            sender=creator.address,
            receiver=self.escrow.address(),
            amt=MIN_BALANCE,
            sp=sp
        )

        transaction.assign_group_id([txn, fund_escrow_txn])
        
        signed_txn = txn.sign(creator.private_key)
        signed_fund_escrow_txn = fund_escrow_txn.sign(creator.private_key)
        last_txn_id = signed_fund_escrow_txn.transaction.get_txid()

        self.client.send_transactions([signed_txn, signed_fund_escrow_txn])

        _ = wait_for_transaction(self.client, last_txn_id)
        self.console.print(f"Updated app {self.app_id} with escrow account {self.escrow.address()}", style='info')
        
    def __optin_app(self, user):    
        txn = transaction.ApplicationOptInTxn(
            sender=user.address,
            index=self.app_id,
            sp=self.client.suggested_params(),
        )
        signed_txn = txn.sign(user.private_key)
        txn_id = signed_txn.transaction.get_txid()

        self.client.send_transaction(signed_txn)
        _ = wait_for_transaction(self.client, txn_id)
        self.console.print(f"Address {user.address} opted-in in app {self.app_id}", style='info')
    
    
    def __send_donation(self, funder, amount):
        usr_local_state = read_user_local_state_for_app(self.client, funder.address, self.app_id)
        if usr_local_state is None:
            _ = self.__optin_app(funder)
        else:
            self.console.print(f"Address {funder.address} already opted in app {self.app_id}", style='info')
        sp_app_call, sp_pay_call = self.__build_sp_for_grouped_txns(group_size=2)

        print(amount)
        app_call_txn = transaction.ApplicationCallTxn(
            sender=funder.address,
            index=self.app_id,
            on_complete=transaction.OnComplete.NoOpOC,
            app_args=[b"donate"],
            sp=sp_app_call,
        )
        donation_txn = transaction.PaymentTxn(
            sender=funder.address,
            receiver=self.escrow.address(),
            amt=amount,
            sp=sp_pay_call,
        )

        transaction.assign_group_id([app_call_txn, donation_txn])

        signed_app_call_txn = app_call_txn.sign(funder.private_key)
        signed_donation_txn = donation_txn.sign(funder.private_key)
        last_txn_id = signed_donation_txn.transaction.get_txid()

        self.client.send_transactions([signed_app_call_txn, signed_donation_txn])
        _ = wait_for_transaction(self.client, last_txn_id)
        self.console.print(f"User {funder.address} funded with {amount} app {self.app_id}", style='info')

    def __get_amount_from_app(self, user):
        app_info = [info for info in self.client.account_info(user.address)['apps-local-state'] if info['id'] == self.app_id][0]
        amount = app_info['key-value'][0]['value']['uint']
        return amount

    def __build_sp_for_grouped_txns(self, group_size=2):
        sp_app_call, sp_pay_call = self.client.suggested_params(), self.client.suggested_params()
        sp_app_call.flat_fee = True
        sp_pay_call.flat_fee = True
        sp_app_call.fee = group_size * constants.MIN_TXN_FEE
        sp_pay_call.fee = 0

        return sp_app_call, sp_pay_call

    def __refund_user(self, user):
        amount = self.__get_amount_from_app(user)

        sp_app_call, sp_pay_call = self.__build_sp_for_grouped_txns()

        txn = transaction.ApplicationCallTxn(
            sender=user.address,
            index=self.app_id,
            on_complete=transaction.OnComplete.NoOpOC,
            app_args=[b"refund"],
            sp=sp_app_call,
        )

        payment_txn = transaction.PaymentTxn(
            sender=self.escrow.address(),
            receiver=user.address,
            amt=amount,
            sp=sp_pay_call
        )

        transaction.assign_group_id([txn, payment_txn])

        signed_txn = txn.sign(user.private_key)
        signed_payment_txn = transaction.LogicSigTransaction(payment_txn, self.escrow)
        last_txn_id = signed_payment_txn.transaction.get_txid()

        self.client.send_transactions([signed_txn, signed_payment_txn])
        _ = wait_for_transaction(self.client, last_txn_id)
        self.console.print(f"Refunded user {user.address} with {amount} from app {self.app_id}", style='info')
    
    def __claim_funds(self, creator):
        amount = read_global_state(self.client, self.app_id)['CURRENT_AMOUNT']

        sp_app_call, sp_pay_call = self.__build_sp_for_grouped_txns()

        txn = transaction.ApplicationCallTxn(
            sender=creator.address,
            index=self.app_id,
            on_complete=transaction.OnComplete.NoOpOC,
            app_args=[b"claim"],
            sp=sp_app_call,
        )

        payment_txn = transaction.PaymentTxn(
            sender=self.escrow.address(),
            receiver=creator.address,
            amt=amount,
            sp=sp_pay_call
        )

        transaction.assign_group_id([txn, payment_txn])

        signed_txn = txn.sign(creator.private_key)
        signed_payment_txn = transaction.LogicSigTransaction(payment_txn, self.escrow)
        last_txn_id = signed_payment_txn.transaction.get_txid()

        self.client.send_transactions([signed_txn, signed_payment_txn])
        _ = wait_for_transaction(self.client, last_txn_id)
        self.console.print(f"Creator {creator.address} claimed {amount} from app {self.app_id}", style='info')
    
    def __close_crowdfunding(self, closer):
        sp = self.client.suggested_params()

        txn = transaction.ApplicationDeleteTxn(
            sender=closer.address,
            index=self.app_id,
            sp=sp
        )
        close_escrow_txn = transaction.PaymentTxn(
            sender=self.escrow.address(),
            receiver=self.escrow.address(),
            close_remainder_to=closer.address,
            amt=0,
            sp=sp
        )
        transaction.assign_group_id([txn, close_escrow_txn])

        signed_txn = txn.sign(closer.private_key)
        signed_close_txn = transaction.LogicSigTransaction(close_escrow_txn, self.escrow)
        last_txn_id = signed_close_txn.get_txid()

        self.client.send_transactions([signed_txn, signed_close_txn])
        _ = wait_for_transaction(self.client, last_txn_id)
        self.is_online = False
        self.console.print(f"Deleted app with id {self.app_id} and closed the associated escrow", style='info')
    
    def __print_infos(self):
        if self.is_online:
            self.console.print('[warning]Global state:[/warning]', read_global_state(self.client, self.app_id))
        self.console.print('[warning]User state for this app:[/warning]', read_user_local_state_for_app(self.client, self.accounts['doner'].address, self.app_id))
        if self.escrow is not None:
            self.console.print('[warning]The escrow account now contains [/warning]', self.client.account_info(self.escrow.address())['amount'], 'microAlgos')
    
    def run(self, is_successful=True, is_sponsored=True):
        if is_successful:
            amount_to_donate = int(self.goal * 2)
        else:
            amount_to_donate = int(self.goal / 2)
        
        current_timestamp = time.time()

        sponsored_bit = 1 if is_sponsored else 0

        app_args = [
            int(current_timestamp + 30).to_bytes(8, "big"),
            int(current_timestamp + 120).to_bytes(8, "big"),
            self.goal.to_bytes(8, "big"),
            encoding.decode_address(self.accounts['platform']),
            int(sponsored_bit).to_bytes(8, "big")
        ]
        
        self.console.print("--------------------------------------------")
        self.console.print("Deploying Crowdfunding application......")
        
        self.__start_crowdfunding(self.accounts['creator'], app_args)
        self.__print_infos()

        self.console.print("--------------------------------------------")
        self.console.print("Deploying escrow account and linking it to application......")
        
        self.__deploy_escrow_and_update_app(self.accounts['creator'])
        self.__print_infos()

        time.sleep(30)

        self.console.print("--------------------------------------------")
        self.console.print("User opt-in and send funds to the application......")

        self.__send_donation(self.accounts['doner'], amount_to_donate)
        self.__print_infos()

        time.sleep(80)

        try:
            self.console.print("--------------------------------------------")
            self.console.print("Refunding user from application......")

            self.__refund_user(self.accounts['doner'])
            self.__print_infos()
        except:
            self.console.print('Refunding is not possible when the goal was reached', style='danger')
        
        try:
            self.console.print("--------------------------------------------")
            self.console.print("Claiming funds from application......")

            self.__claim_funds(self.accounts['creator'])
            self.__print_infos()
        except:
            self.console.print("Claiming funds is not possible if the goal is not reached", style='danger')
        
        self.console.print("--------------------------------------------")
        self.console.print("Deleting Crowdfunding application......")
        
        self.__close_crowdfunding(self.accounts['creator'])
        self.__print_infos()



if __name__ == '__main__':
    app = DemoApp()
    app.run(is_successful=False)
