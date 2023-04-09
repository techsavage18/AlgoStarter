from pyteal import *

class FundingProject:
    class LocalVariables:
        account_investment = Bytes("ACCOUNT_INVESTMENT")

    class Variables:        
        start_date = Bytes("START_DATE")
        end_date = Bytes("END_DATE")
        goal_amount = Bytes("GOAL_AMOUNT")
        creator_address = Bytes("CREATOR")
        escrow_addres = Bytes("ESCROW_ADDR")
        current_amount = Bytes("CURRENT_AMOUNT")
        platform_address = Bytes("PLATFORM_ADDRESS")
        is_sponsored = Bytes('IS_SPONSORED')

    class AppMethods:
        donate = Bytes("donate")
        claim = Bytes("claim")
        refund = Bytes("refund")
    
    def funding_project_creation(self):
        return Seq([
            Assert(Txn.application_args.length() == Int(5)),
            Assert(Le(Global.latest_timestamp(), Btoi(Txn.application_args[0]))),
            Assert(Ge(Btoi(Txn.application_args[1]), Btoi(Txn.application_args[0]))),
            Assert(Btoi(Txn.application_args[2]) > Int(0)),
            App.globalPut(self.Variables.start_date, Btoi(Txn.application_args[0])),
            App.globalPut(self.Variables.end_date, Btoi(Txn.application_args[1])),
            App.globalPut(self.Variables.goal_amount, Btoi(Txn.application_args[2])),
            App.globalPut(self.Variables.platform_address, Txn.application_args[3]),
            App.globalPut(self.Variables.is_sponsored, Btoi(Txn.application_args[4])),
            App.globalPut(self.Variables.creator_address, Txn.sender()),
            App.globalPut(self.Variables.current_amount, Int(0)),
            If(App.globalGet(self.Variables.is_sponsored) == Int(1)).Then(Seq([
                Assert(Global.group_size() == Int(2)),
                Assert(Gtxn[1].type_enum() == TxnType.Payment),
                Assert(Gtxn[1].receiver() == App.globalGet(self.Variables.platform_address)),
                Assert(Gtxn[1].amount() >= Global.min_txn_fee())
                ])),
            Approve()
        ])

    def delete_app(self):
        # Can only be called by the creator and only when the campaign is complete
        return Seq([
            Assert(Txn.sender() == App.globalGet(self.Variables.creator_address)),
            Assert(Ge(Global.latest_timestamp(), App.globalGet(self.Variables.end_date))),
            Approve()
        ])

    def opt_in_app(self):
        return Seq([
            Assert(Ge(Global.latest_timestamp(), App.globalGet(self.Variables.start_date))),
            App.localPut(Txn.sender(), self.LocalVariables.account_investment, Int(0)),
            Approve()
        ])

    def update_app(self):
        return Seq([
            # Check that it only has one argument
            Assert(Txn.application_args.length() == Int(1)),
            # Check that it's called by the creator of the project
            Assert(Txn.sender() == App.globalGet(self.Variables.creator_address)),
            # Store that one argument in the global escrow_address variable
            App.globalPut(self.Variables.escrow_addres, Txn.application_args[0]),
            Approve()
        ])
    
    def donate(self):
        # (maybe) have the escrow account stranfer ASAs to the donator +
        # (maybe) have the platform obtain a small fee on the payment
        increment_global = App.globalPut(
            self.Variables.current_amount, 
            App.globalGet(self.Variables.current_amount) + Gtxn[1].amount()
            )

        increment_local = App.localPut(
            Gtxn[1].sender(), self.LocalVariables.account_investment,
            App.localGet(Gtxn[1].sender(), self.LocalVariables.account_investment) + Gtxn[1].amount()
        )

        return Seq([
            Assert(App.optedIn(Txn.sender(), Global.current_application_id())),
            Assert(Ge(Global.latest_timestamp(), App.globalGet(self.Variables.start_date))),
            Assert(Le(Global.latest_timestamp(), App.globalGet(self.Variables.end_date))),
            Assert(Global.group_size() == Int(2)),
            Assert(Gtxn[1].type_enum() == TxnType.Payment),
            Assert(Gtxn[1].receiver() == App.globalGet(self.Variables.escrow_addres)),
            Assert(Gtxn[1].amount() >= Global.min_txn_fee()),
            increment_global,
            increment_local,
            Approve()
        ])
    
    def claim(self):
        return Seq([
            # Check that the current date is after end_date
            Assert(Ge(Global.latest_timestamp(), App.globalGet(self.Variables.end_date))),
            # Check that the the goal was reached
            Assert(App.globalGet(self.Variables.current_amount) >= App.globalGet(self.Variables.goal_amount)),
            # Check that the caller is the creator of the app
            Assert(Txn.sender() == App.globalGet(self.Variables.creator_address)),
            # Decrement the global variable current_funds
            App.globalPut(self.Variables.current_amount, Int(0)),
            Approve()
        ])
    
    def refund(self):
        user_investment = App.localGet(Txn.sender(), self.LocalVariables.account_investment)

        # decrease current funding amount of the contract
        decrement_global = App.globalPut(
            self.Variables.current_amount,
            App.globalGet(self.Variables.current_amount) - user_investment
            )

        # set user invested amount to zero
        decrement_local = App.localPut(
            Txn.sender(), self.LocalVariables.account_investment, Int(0)
        )

        return Seq([
            # check current date is bigger than end date
            Assert(Ge(Global.latest_timestamp(), App.globalGet(self.Variables.end_date))),
            # check goal has not been reached
            Assert(App.globalGet(self.Variables.current_amount) <= App.globalGet(self.Variables.goal_amount)),
            # check user investment is greater than zero
            Assert(user_investment > Int(0)),
            decrement_global,
            decrement_local,
            Approve()
        ])

    def approval_program(self):
        return Cond(
            # If the application_id field of a transaction is zero, 
            # then the application doesn't exist yet and we have to create it
            [Txn.application_id() == Int(0), self.funding_project_creation()],
            [Txn.on_completion() == OnComplete.DeleteApplication, self.delete_app()],
            [Txn.on_completion() == OnComplete.UpdateApplication, self.update_app()],
            [Txn.on_completion() == OnComplete.OptIn, self.opt_in_app()],
            [Txn.application_args[0] == self.AppMethods.donate, self.donate()],
            [Txn.application_args[0] == self.AppMethods.claim, self.claim()],
            [Txn.application_args[0] == self.AppMethods.refund, self.refund()]
            )
    
    def clear_program(self):
        # Should delete the local state of the user (i.e.: the account_investment)
        get_invested_amount = App.localGetEx(Int(0), App.id(), self.LocalVariables.account_investment)
        return Seq([
            get_invested_amount,
            If(get_invested_amount.hasValue(),
                App.globalPut(get_invested_amount.value(), Int(0))
            ),
            Return(Int(1))
        ])