const { Keypair, Asset, Networks, Contract, nativeToScVal } = require('@stellar/stellar-sdk');
const { rpc } = require('@stellar/stellar-sdk');

async function main() {
  const server = new rpc.Server('https://soroban-testnet.stellar.org');
  const source = Keypair.random();
  console.log("Source:", source.publicKey());
  
  await fetch('https://friendbot.stellar.org?addr=' + source.publicKey());
  console.log("Funded!");

  const contractId = 'CC7Z3ALJMFFI3ICBTLJQGZQTA3XPIWCEOSBO3TMQQD52A3FQFM6VLVYS';
  const nativeAsset = Asset.native().contractId(Networks.TESTNET);
  const contract = new Contract(nativeAsset);
  
  const { TransactionBuilder } = require('@stellar/stellar-sdk');
  const account = await server.getAccount(source.publicKey());
  
  const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: Networks.TESTNET })
    .addOperation(
      contract.call("transfer", 
        nativeToScVal(source.publicKey(), { type: 'address' }),
        nativeToScVal(contractId, { type: 'address' }),
        nativeToScVal(10000000, { type: 'i128' }) // 1 XLM
      )
    ).setTimeout(30).build();
    
  const preparedTx = await server.prepareTransaction(tx);
  preparedTx.sign(source);
  
  const sendRes = await server.sendTransaction(preparedTx);
  console.log("Sent:", sendRes);

  let status = sendRes.status;
  while (status === "PENDING") {
    await new Promise(r => setTimeout(r, 2000));
    const txInfo = await server.getTransaction(sendRes.hash);
    status = txInfo.status;
    console.log("Status:", status);
  }
}

main().catch(console.error);
