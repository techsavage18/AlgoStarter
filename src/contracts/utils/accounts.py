from algosdk.kmd import KMDClient

KMD_ADDRESS = "http://localhost:4002"
KMD_TOKEN = "your-address-here"

KMD_WALLET_NAME = "encrypted-default-wallet"
KMD_WALLET_PASSWORD = "your-password-here"

class Account:
    def __init__(self, private_key, address):
        self.private_key = private_key
        self.address = address
    
    def __str__(self):
        return f"Address: {self.address}"

    def __repr__(self):
        return self.__str__()

def get_accounts():
    kmd = KMDClient(KMD_TOKEN, KMD_ADDRESS)
    wallets = [wallet for wallet in kmd.list_wallets() if wallet['name'] == KMD_WALLET_NAME]

    if not wallets:
        raise Exception(f'Wallet {KMD_WALLET_NAME} not found!')
    
    wallet_handle = kmd.init_wallet_handle(wallets[0]['id'], KMD_WALLET_PASSWORD)

    try:
        addresses = kmd.list_keys(wallet_handle)
        accounts = [
            Account(
                private_key=kmd.export_key(wallet_handle, KMD_WALLET_PASSWORD, addr),
                address=addr
            ) for addr in addresses
        ]
    finally:
        kmd.release_wallet_handle(wallet_handle)
    
    return accounts

print(get_accounts())