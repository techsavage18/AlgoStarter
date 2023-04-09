import base64

from pyteal import *
from algosdk import encoding
from algosdk.future import transaction

def compile_contract(contract, client, is_app=True):
    if is_app:
        mode = Mode.Application
    else:
        mode = Mode.Signature
    
    teal_code = compileTeal(contract, mode, version=6)
    compile_response = client.compile(teal_code)
    return base64.b64decode(compile_response['result'])

# helper function that formats state for printing
def format_state(state):
    formatted = {}
    for item in state:
        key = item['key']
        value = item['value']
        formatted_key = base64.b64decode(key).decode('utf-8')
        if value['type'] == 1:
            try:
                formatted_value = base64.b64decode(value.get("bytes", "")).decode('utf-8')
            except:
                formatted_value = encoding.encode_address(base64.b64decode(value.get("bytes", "").strip()))
        else:
            formatted_value = value['uint']
        formatted[formatted_key] = formatted_value
        
    return formatted

# helper function to read app global state
def read_global_state(client, app_id):
    app = client.application_info(app_id)
    global_state = app['params']['global-state'] if "global-state" in app['params'] else []
    return format_state(global_state)

# helper function to read user local state
def read_user_local_state_for_app(client, addr, app_id) :   
    results = client.account_info(addr)
    local_state = results['apps-local-state']
    out = None
    for app in local_state:
        if app['id'] == app_id:
            out = format_state(app['key-value'])
    return out

def wait_for_transaction(client, txn_id):
    try:
        transaction_response = transaction.wait_for_confirmation(client, txn_id)
        print("TXID: ", txn_id)
        print("Result confirmed in round: {}".format(transaction_response['confirmed-round']))

    except Exception as err:
        print(err)
        return

    # display results
    transaction_response = client.pending_transaction_info(txn_id)
    app_id = transaction_response.get('application-index')
    return app_id