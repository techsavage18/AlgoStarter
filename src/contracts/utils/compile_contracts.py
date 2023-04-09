from pyteal import *
import os

from ..crowdfund_contract import FundingProject
from ..escrow import EscrowAccount

BASE_PATH = os.path.normpath('src/contracts/teal')

if __name__ == "__main__":
    
    crowdfunding_program = FundingProject()
    approval_program = crowdfunding_program.approval_program()
    clear_program = crowdfunding_program.clear_program()
    escrow = EscrowAccount().create_account(12)

    # Mode.Application specifies that this is a smart contract
    compiled_approval = compileTeal(approval_program, Mode.Application, version=6)
    with open(os.path.join(BASE_PATH, "crowdfunding_approval.teal"), "w") as teal:
        teal.write(compiled_approval)

    # Mode.Application specifies that this is a smart contract
    compiled_clear = compileTeal(clear_program, Mode.Application, version=6)
    with open(os.path.join(BASE_PATH, "crowdfunding_clear.teal"), "w") as teal:
        teal.write(compiled_clear)

    compiled_escrow = compileTeal(escrow, Mode.Signature, version=6)
    with open(os.path.join(BASE_PATH, "escrow.teal"), "w") as teal:
        teal.write(compiled_escrow)