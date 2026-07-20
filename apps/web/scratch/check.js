const { Contract, Address, rpc, scValToNative, TransactionBuilder, Account } = require("@stellar/stellar-sdk");
const SOROBAN_RPC = "https://soroban-testnet.stellar.org";
const VAULT_ID = "CAQFOWQLHE3BBOAGMJZNPCIASUOSJJCUQLJE6V6VSMW7H7ST4OOHD77C";
const USER_ADDR = "GCZGINCFJLT5P46AEZ6PZ54632FRIN3ITHHMOWXXGP2S4RZN6KIDVK6C";

async function check() {
    const server = new rpc.Server(SOROBAN_RPC);
    const contract = new Contract(VAULT_ID);
    
    const tx = new TransactionBuilder(
        new Account(USER_ADDR, "0"),
        { fee: "100", networkPassphrase: "Test SDF Network ; September 2015" }
    ).addOperation(contract.call("balance", new Address(USER_ADDR).toScVal())).setTimeout(30).build();
    
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim)) {
        console.log("Balance:", scValToNative(sim.result.retval));
    } else {
        console.error("Simulation failed:", sim.error);
    }
}
check();
