const { Keypair, Networks, TransactionBuilder, Operation, Address, rpc, Contract, nativeToScVal } = require("@stellar/stellar-sdk");

const IS_TESTNET = true;
const NETWORK_PASSPHRASE = IS_TESTNET ? Networks.TESTNET : Networks.PUBLIC;
const SOROBAN_RPC = IS_TESTNET ? "https://soroban-testnet.stellar.org" : "https://soroban.stellar.org";
const server = new rpc.Server(SOROBAN_RPC);

const ROUTER_ID = "CBJQ5ABTAU37OHQGD4HHLNYECUTVPJXS4BUFNWBLM7IVHBH6EIQMSJJ2";
const VAULT_ID = "CAQFOWQLHE3BBOAGMJZNPCIASUOSJJCUQLJE6V6VSMW7H7ST4OOHD77C";

async function init() {
    console.log("Generating keypair for invoker...");
    const invoker = Keypair.random();
    
    console.log("Funding invoker via Friendbot...");
    const friendbotUrl = `https://friendbot.stellar.org?addr=${invoker.publicKey()}`;
    await fetch(friendbotUrl);
    
    let account = await server.getAccount(invoker.publicKey());
    
    console.log("Building invoke transaction for router.initialize()...");
    const contract = new Contract(ROUTER_ID);
    
    const tx = new TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: NETWORK_PASSPHRASE,
    })
    .addOperation(contract.call("initialize", 
        new Address(invoker.publicKey()).toScVal(),
        new Address(VAULT_ID).toScVal()
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
            console.log("Initialized successfully!");
            return;
        }
        if (status.status === "FAILED") {
            throw new Error(`Tx failed`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

init().catch(console.error);
