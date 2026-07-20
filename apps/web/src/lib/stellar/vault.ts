import { Contract, rpc, Address, scValToNative, TransactionBuilder, BASE_FEE } from "@stellar/stellar-sdk";
import { getHorizonServer, STELLAR_NETWORK_PASSPHRASE, SOROBAN_RPC_URL } from "./config";

export async function fetchVaultBalance(publicKey: string): Promise<number> {
  try {
    const server = new rpc.Server(SOROBAN_RPC_URL);
    const horizon = getHorizonServer();
    
    // We need an account to simulate the transaction. The user's own account is fine.
    const account = await horizon.loadAccount(publicKey);
    
    const contract = new Contract(process.env.NEXT_PUBLIC_SOROBAN_VAULT!);
    
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    })
    .addOperation(
      contract.call(
        "balance",
        new Address(publicKey).toScVal()
      )
    )
    .setTimeout(30)
    .build();

    const sim = await server.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationSuccess(sim)) {
      const resultScVal = sim.result.retval;
      // Convert to native JS number. The contract returns an i128 (stroops).
      const stroops = scValToNative(resultScVal);
      // Convert stroops to standard units (XLM usually has 7 decimals)
      return Number(stroops) / 10000000;
    }
    
    return 0;
  } catch (err) {
    console.error("Failed to fetch vault balance:", err);
    return 0;
  }
}
