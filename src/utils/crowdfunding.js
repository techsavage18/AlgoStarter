import algosdk from "algosdk";
import { Buffer } from "buffer";
import {
    algodClient,
    crowdfundingAppNote,
    initialAppId,
    numGlobalBytes,
    numGlobalInts,
    numLocalBytes,
    numLocalInts,
    MIN_ACCOUNT_BALANCE,
    donateArg,
    claimArg,
    refundArg,
    amountInvestedKey,
    currentAmountKey,
    sponsoredProjectFee,
    platformAddr
} from "./constants";

import raw from "raw.macro";

//const markdown = raw("./README.md");

const approvalProgram = raw("../contracts/teal/crowdfunding_approval.teal");
const clearProgram = raw("../contracts/teal/crowdfunding_clear.teal");
const escrowProgram = raw("../contracts/teal/escrow.teal");

export class crowdfundingProject {
    constructor(name, image, description, goal, startDate, endDate, creator, isSponsored=false, current_amount=0, appId=0, escrow=null, deleted=false, claimed=false, platform=platformAddr) {
        this.name = name;
        this.image = image;
        this.description = description;
        this.goal = goal;
        this.current_amount = current_amount;
        this.creator = creator;
        this.startDate = startDate;
        this.endDate = endDate;
        this.appId = appId;
        this.escrow = escrow;
        this.isSponsored = isSponsored;
        this.deleted = deleted;
        this.claimed = claimed;
        this.platform = platformAddr;
    }
}

const compileProgram = async (programSource) => {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(programSource);
    let compileResponse = await algodClient.compile(programBytes).do();
    return new Uint8Array(Buffer.from(compileResponse.result, "base64"));
}

let compiledApprovalProgram;
let compiledClearProgram;

export const createProjectAction = async (senderAddress, project) => {
    console.log("Adding project...")
    console.log(project)

    compiledApprovalProgram = await compileProgram(approvalProgram);
    compiledClearProgram = await compileProgram(clearProgram)

    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;

    // Build note to identify transaction later and required app args as Uint8Arrays
    let note = new TextEncoder().encode(crowdfundingAppNote);

    let goal = algosdk.encodeUint64(project.goal);
    let startDate = algosdk.encodeUint64(project.startDate);
    let endDate = algosdk.encodeUint64(project.endDate);
    let platform = algosdk.decodeAddress(platformAddr).publicKey;
    let isSponsored = algosdk.encodeUint64(project.isSponsored? 1: 0);

    let appArgs = [startDate, endDate, goal, platform, isSponsored]
    console.log(startDate, endDate, goal)

    // Create ApplicationCreateTxn
    let txn = algosdk.makeApplicationCreateTxnFromObject({
        from: senderAddress,
        suggestedParams: params,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram: compiledApprovalProgram,
        clearProgram: compiledClearProgram,
        numLocalInts: numLocalInts,
        numLocalByteSlices: numLocalBytes,
        numGlobalInts: numGlobalInts,
        numGlobalByteSlices: numGlobalBytes,
        note: note,
        appArgs: appArgs
    });

    let txId;

    if (!project.isSponsored) {
        // Get transaction ID
        txId = txn.txID().toString();
        const txn_b64 = await window.AlgoSigner.encoding.msgpackToBase64(txn.toByte());

        // Sign & submit the transaction
        let signedTxn = await window.AlgoSigner.signTxn([{ txn: txn_b64 }]);
        console.log("Signed transaction with txID: %s", txId);

        let binarySignedTx = await window.AlgoSigner.encoding.base64ToMsgpack(
            signedTxn[0].blob
        );
        console.log("Attempting to send transaction")
        await algodClient.sendRawTransaction(binarySignedTx).do();
        console.log("Sent transaction with txID: %s", txId)

    } else {
        let feeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: senderAddress,
            to: platformAddr,
            amount: sponsoredProjectFee,
            suggestedParams: params
        })

        let txnArray = [txn, feeTxn]

        // Create group transaction out of previously build transactions
        algosdk.assignGroupID(txnArray)
    
        let binaryTxs = [txn.toByte(), feeTxn.toByte()];
        let base64Txs = binaryTxs.map((binary) => window.AlgoSigner.encoding.msgpackToBase64(binary));
        
        let signedTxs = await window.AlgoSigner.signTxn([
            {txn: base64Txs[0]},
            {txn: base64Txs[1]},
          ]);
        console.log("Signed group transaction");
        
        let binarySignedTxs = signedTxs.map((tx) => window.AlgoSigner.encoding.base64ToMsgpack(tx.blob));
        console.log("Attempting to send group transaction")
        await algodClient.sendRawTransaction(binarySignedTxs).do();
        console.log("Sent group transaction")

        txId = signedTxs[0]["txID"];
    }

    // Wait for transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // Get the completed Transaction
    console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

    // Get created application id and notify about completion
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    let appId = transactionResponse['application-index'];
    console.log("Created new app-id: ", appId);
    return appId;
}

export const deployEscrowAndUpdateProjectAction = async (senderAddress, appId) => {
    console.log("Deploying Escrow account...");
    const compiledEscrowProgram = await compileProgram(escrowProgram.replace(initialAppId, appId));
    const escrowLSig = new algosdk.LogicSigAccount(compiledEscrowProgram);

    console.log("This is the logic signature: ", escrowLSig)

    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;

    let appArgs = [algosdk.decodeAddress(escrowLSig.address()).publicKey]

    let appUpdateTxn = algosdk.makeApplicationUpdateTxnFromObject({
        from: senderAddress,
        appIndex: appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram: compiledApprovalProgram,
        clearProgram: compiledClearProgram,
        suggestedParams: params,
        appArgs: appArgs
    })

    let fundEscrowTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAddress,
        to: escrowLSig.address(),
        amount: MIN_ACCOUNT_BALANCE,
        suggestedParams: params
    })

    let txnArray = [appUpdateTxn, fundEscrowTxn]

    // Create group transaction out of previously build transactions
    algosdk.assignGroupID(txnArray)

    let binaryTxs = [appUpdateTxn.toByte(), fundEscrowTxn.toByte()];
    let base64Txs = binaryTxs.map((binary) => window.AlgoSigner.encoding.msgpackToBase64(binary));
    
    let signedTxs = await window.AlgoSigner.signTxn([
        {txn: base64Txs[0]},
        {txn: base64Txs[1]},
      ]);
    console.log("Signed group transaction");
    
    let binarySignedTxs = signedTxs.map((tx) => window.AlgoSigner.encoding.base64ToMsgpack(tx.blob));
    console.log("Attempting to send group transaction")
    await algodClient.sendRawTransaction(binarySignedTxs).do();
    console.log("Sent group transaction")

    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, signedTxs[0]["txID"], 4);
    console.log("Transaction group confirmed in round " + confirmedTxn["confirmed-round"]);
    
    console.log("Deployed Escrow and updated add with id: ", appId);
    return compiledEscrowProgram
}

const optInProjectAction = async (senderAddress, appId) => {
    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;

    let appOptInTxn = algosdk.makeApplicationOptInTxnFromObject({
        from: senderAddress,
        appIndex: appId,
        suggestedParams: params
    })
    // Get transaction ID
    let txId = appOptInTxn.txID().toString();
    const txn_b64 = await window.AlgoSigner.encoding.msgpackToBase64(appOptInTxn.toByte());

    // Sign & submit the transaction
    let signedTxn = await window.AlgoSigner.signTxn([{ txn: txn_b64 }]);
    console.log("Signed transaction with txID: %s", txId);

    let binarySignedTx = await window.AlgoSigner.encoding.base64ToMsgpack(
        signedTxn[0].blob
    );
    console.log("Attempting to send transaction")
    await algodClient.sendRawTransaction(binarySignedTx).do();
    console.log("Sent transaction with txID: %s", txId)

    // Wait for transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // Get the completed Transaction
    console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
    console.log("User opted in app with id: ", appId);
    return confirmedTxn
}

export const fundProjectAndOptInAction = async (senderAddress, escrow, project, amount) => {
        async function checkUserOptedIn() {
          if(!await isUserOptedInApp(senderAddress, project.appId)){ 
            await optInProjectAction(senderAddress, project.appId);
            } else {
            console.log("User already opted-in app: ", project.appId);
            }
        }
        await checkUserOptedIn(); 
        console.log('opted innnn')
        await fundProjectAction(senderAddress, escrow, project, amount);
}

const fundProjectAction = async (senderAddress, escrow, project, amount) => {
    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;

    let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        from: senderAddress,
        appIndex: project.appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [donateArg],
        suggestedParams: params
    })

    let payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAddress,
        to: escrow.address(),
        amount: amount,
        suggestedParams: params
    })

    let txnArray = [appCallTxn, payTxn]

    // Create group transaction out of previously build transactions
    algosdk.assignGroupID(txnArray)

    let binaryTxs = [appCallTxn.toByte(), payTxn.toByte()];
    let base64Txs = binaryTxs.map((binary) => window.AlgoSigner.encoding.msgpackToBase64(binary));
    
    let signedTxs = await window.AlgoSigner.signTxn([
        {txn: base64Txs[0]},
        {txn: base64Txs[1]},
      ]);
    console.log("Signed group transaction");
    
    let binarySignedTxs = signedTxs.map((tx) => window.AlgoSigner.encoding.base64ToMsgpack(tx.blob));
    console.log("Attempting to send group transaction")
    await algodClient.sendRawTransaction(binarySignedTxs).do();
    console.log("Sent group transaction")

    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, signedTxs[0]["txID"], 4);
    console.log("Transaction group confirmed in round " + confirmedTxn["confirmed-round"]);
    
    console.log("Funded project with app ID ", project.appId, " with ", {amount});
    const accountInfo = await algodClient.accountInformation(escrow.address()).do()
    console.log(accountInfo['amount'])

}

export const refundUserAction = async (senderAddress, escrow, project) => {
    const amount = await readUserLocalStateForApp(senderAddress, project.appId);
    console.log("This user invested", amount)
    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE * 2;
    params.flatFee = true;

    let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        from: senderAddress,
        appIndex: project.appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [refundArg],
        suggestedParams: params
    })

    params.fee = 0;
    let payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: escrow.address(),
        to: senderAddress,
        amount: amount,
        suggestedParams: params
    })

    let txnArray = [appCallTxn, payTxn]

    // Create group transaction out of previously build transactions
    algosdk.assignGroupID(txnArray)

    let binaryTxs = [appCallTxn.toByte(), payTxn.toByte()];
    let base64Txs = binaryTxs.map((binary) => window.AlgoSigner.encoding.msgpackToBase64(binary));
    
    let signedTxs = await window.AlgoSigner.signTxn([
        {txn: base64Txs[0]},
        {txn: base64Txs[1], signers: []},
      ]);
    let binarySignedTx2 = algosdk.signLogicSigTransaction(payTxn, escrow).blob
    console.log("Signed group transaction");
    
    let binarySignedTx1 = window.AlgoSigner.encoding.base64ToMsgpack(signedTxs[0].blob);
    console.log("Attempting to send group transaction")
    await algodClient.sendRawTransaction([binarySignedTx1, binarySignedTx2]).do();
    console.log("Sent group transaction")

    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, signedTxs[0]["txID"], 4);
    console.log("Transaction group confirmed in round " + confirmedTxn["confirmed-round"]);
    
    console.log("Refunded user from the funds of app: ", project.appId);
    const accountInfo = await algodClient.accountInformation(escrow.address()).do()
    console.log("The escrow now contains: ", accountInfo['amount'])
    return amount
}

export const claimFundstAction = async (senderAddress, escrow, project) => {
    let totalFunds = await readGlobalState(project.appId)
    totalFunds =  readRequestedKeyFromState(totalFunds, currentAmountKey)
    console.log("Current amount of funds in escrow: ", totalFunds)

    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE * 2;
    params.flatFee = true;

    let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        from: senderAddress,
        appIndex: project.appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [claimArg],
        suggestedParams: params
    })

    params.fee = 0;
    let payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: escrow.address(),
        to: senderAddress,
        amount: totalFunds,
        suggestedParams: params
    })

    let txnArray = [appCallTxn, payTxn]

    // Create group transaction out of previously build transactions
    algosdk.assignGroupID(txnArray)

    let binaryTxs = [appCallTxn.toByte(), payTxn.toByte()];
    let base64Txs = binaryTxs.map((binary) => window.AlgoSigner.encoding.msgpackToBase64(binary));
    
    let signedTxs = await window.AlgoSigner.signTxn([
        {txn: base64Txs[0]},
        {txn: base64Txs[1], signers: []},
      ]);
    let binarySignedTx2 = algosdk.signLogicSigTransaction(payTxn, escrow).blob
    console.log("Signed group transaction");
    
    let binarySignedTx1 = window.AlgoSigner.encoding.base64ToMsgpack(signedTxs[0].blob);
    console.log("Attempting to send group transaction")
    await algodClient.sendRawTransaction([binarySignedTx1, binarySignedTx2]).do();
    console.log("Sent group transaction")

    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, signedTxs[0]["txID"], 4);
    console.log("Transaction group confirmed in round " + confirmedTxn["confirmed-round"]);
    
    console.log("Creator claimed all the funds in app: ", project.appId);
    const accountInfo = await algodClient.accountInformation(escrow.address()).do()
    console.log("The escrow now contains: ", accountInfo['amount'])
}

export const deleteProjectAction = async (senderAddress, escrow, project) => {
    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;

    let appCallTxn = algosdk.makeApplicationDeleteTxnFromObject({
        from: senderAddress,
        appIndex: project.appId,
        suggestedParams: params
    })
    let closeEscrowTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: escrow.address(),
        to: escrow.address(),
        closeRemainderTo: senderAddress,
        amount: 0,
        suggestedParams: params
    })

    let txnArray = [appCallTxn, closeEscrowTxn]

    // Create group transaction out of previously build transactions
    algosdk.assignGroupID(txnArray)

    let binaryTxs = [appCallTxn.toByte(), closeEscrowTxn.toByte()];
    let base64Txs = binaryTxs.map((binary) => window.AlgoSigner.encoding.msgpackToBase64(binary));
    
    let signedTxs = await window.AlgoSigner.signTxn([
        {txn: base64Txs[0]},
        {txn: base64Txs[1], signers: []},
      ]);
    let binarySignedTx2 = algosdk.signLogicSigTransaction(closeEscrowTxn, escrow).blob
    console.log("Signed group transaction");
    
    let binarySignedTx1 = window.AlgoSigner.encoding.base64ToMsgpack(signedTxs[0].blob);
    console.log("Attempting to send group transaction")
    await algodClient.sendRawTransaction([binarySignedTx1, binarySignedTx2]).do();
    console.log("Sent group transaction")

    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, signedTxs[0]["txID"], 4);
    console.log("Transaction group confirmed in round " + confirmedTxn["confirmed-round"]);
    
    console.log("Emptied escrow account and deleted app with id:  ", project.appId);
    const accountInfo = await algodClient.accountInformation(escrow.address()).do()
    console.log("The escrow now contains: ",accountInfo['amount'])
}

const readUserLocalStateForApp = async (userAddress, appId) => {
    let accountInfo = await algodClient.accountApplicationInformation(userAddress, appId).do()
    accountInfo = accountInfo['app-local-state']['key-value']
    return readRequestedKeyFromState(accountInfo, amountInvestedKey)
}

const readRequestedKeyFromState = (state, key) => {
    const requestedInfo = state?.filter(e => e.key === key);
    if (requestedInfo) return requestedInfo[0]["value"]["uint"]
    else return 0
}

const isUserOptedInApp = async (userAddress, appId) => {
    const accountInfo = await algodClient.accountApplicationInformation(userAddress, appId).do()
    return 'app-local-state' in accountInfo
}

const readGlobalState = async (appId) => {
    try {
        let applicationInfoResponse = await algodClient.getApplicationByID(appId).do();
        let globalStateTemp = applicationInfoResponse["params"]["global-state"];
        return globalStateTemp
    } catch (err) {
        console.log(err);
    }
};
