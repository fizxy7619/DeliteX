const { Keypair, Networks, TransactionBuilder, Operation, Address, rpc, Contract, Asset } = require("@stellar/stellar-sdk");

const IS_TESTNET = true;
const NETWORK_PASSPHRASE = IS_TESTNET ? Networks.TESTNET : Networks.PUBLIC;
const SOROBAN_RPC = IS_TESTNET ? "https://soroban-testnet.stellar.org" : "https://soroban.stellar.org";
const server = new rpc.Server(SOROBAN_RPC);

const VAULT_ID = "CAE3KJ5UNOJCEKNNXJ2H6DNKWQZCOUAQAN2UXUXZVRKMXOVAFXDYGJSW";

async function initVault() {
    console.log("Generating keypair for invoker...");
    const invoker = Keypair.random();
    
    console.log("Funding invoker via Friendbot...");
    const friendbotUrl = `https://friendbot.stellar.org?addr=${invoker.publicKey()}`;
    await fetch(friendbotUrl);
    
    let account = await server.getAccount(invoker.publicKey());
    
    const nativeAssetContractId = Asset.native().contractId(NETWORK_PASSPHRASE);
    console.log("Native XLM Contract ID on this network: " + nativeAssetContractId);

    console.log("Building invoke transaction for vault.initialize()...");
    const contract = new Contract(VAULT_ID);
    
    const tx = new TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: NETWORK_PASSPHRASE,
    })
    .addOperation(contract.call("initialize", 
        new Address(invoker.publicKey()).toScVal(),
        new Address(nativeAssetContractId).toScVal()
    ))
    .setTimeout(30)
    .build();

    console.log("Simulating transaction...");
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
        throw new Error("Simulate failed: " + sim.error);
    }

    console.log("Assembling and sending transaction...");
    const prepTx = rpc.assembleTransaction(tx, sim).build();
    prepTx.sign(invoker);

    const sendRes = await server.sendTransaction(prepTx);
    if (sendRes.status === "ERROR") {
        throw new Error("Send Error");
    }

    console.log("Waiting for confirmation... Tx hash:", sendRes.hash);
    for (let i = 0; i < 30; i++) {
        const status = await server.getTransaction(sendRes.hash);
        if (status.status === "SUCCESS") {
            console.log("Vault initialized successfully!");
            return;
        }
        if (status.status === "FAILED") {
            throw new Error(`Tx failed`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

initVault().catch(console.error);
