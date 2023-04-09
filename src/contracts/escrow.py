from pyteal import *

class EscrowAccount:
    def create_account(self, app_id):
        check_group_size = Global.group_size() == Int(2)

        first_txn_is_appcall = Gtxn[0].type_enum() == TxnType.ApplicationCall
        correct_app_id = Gtxn[0].application_id() == Int(app_id)

        check_type_of_call = Or(
            Gtxn[0].on_completion() == OnComplete.NoOp,
            Gtxn[0].on_completion() == OnComplete.DeleteApplication
            )
        
        no_rekey_addr = And(
            Gtxn[0].rekey_to() == Global.zero_address(), 
            Gtxn[1].rekey_to() == Global.zero_address()
            )
        
        return And(
            check_group_size,
            first_txn_is_appcall,
            correct_app_id,
            check_type_of_call,
            no_rekey_addr
        )