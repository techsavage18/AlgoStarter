import algosdk from "algosdk";

const config = {
    algodToken: "",
    algodServer: "https://node.testnet.algoexplorerapi.io",
    algodPort: "",
    indexerToken: "",
    indexerServer: "https://algoindexer.testnet.algoexplorerapi.io",
    indexerPort: "",
}

export const algodClient = new algosdk.Algodv2(config.algodToken, config.algodServer, config.algodPort)

export const indexerClient = new algosdk.Indexer(config.indexerToken, config.indexerServer, config.indexerPort);

export const AlgoSigner = window.AlgoSigner

export const crowdfundingAppNote = "crazy-crowdfunding:uv1"
export const initialAppId = 12;
export const MIN_ACCOUNT_BALANCE = 100_000

export const numLocalInts = 1;
export const numLocalBytes = 0;
// Maximum global storage allocation, immutable
export const numGlobalInts = 5; 
export const numGlobalBytes = 12; 

export const sponsoredProjectFee = 50_000;
export const platformAddr = "UOFKRF6BIGRBYW2TUKKUBC24PWOA6GNM62ZIA77IBBT5RMYRPR3W25XPPQ";

export const ALGORAND_DECIMALS = 6;
export const amountInvestedKey = "QUNDT1VOVF9JTlZFU1RNRU5U"
export const currentAmountKey = "Q1VSUkVOVF9BTU9VTlQ="

export const donateArg = new TextEncoder().encode("donate")
export const refundArg = new TextEncoder().encode("refund")
export const claimArg = new TextEncoder().encode("claim")