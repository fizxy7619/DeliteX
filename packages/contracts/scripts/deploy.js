const { Keypair, Networks, TransactionBuilder, Operation, Contract, Address, rpc, scValToNative } = require("@stellar/stellar-sdk");
const fs = require("fs");
const path = require("path");

const IS_TESTNET = true;
const NETWORK_PASSPHRASE = IS_TESTNET ? Networks.TESTNET : Networks.PUBLIC;
const SOROBAN_RPC = IS_TESTNET ? "https://soroban-testnet.stellar.org" : "https://soroban.stellar.org";
const server = new rpc.Server(SOROBAN_RPC);

async function deploy() {
    console.log("Generating deployer keypair...");
    const deployer = Keypair.random();
    console.log(`Deployer Public Key: ${deployer.publicKey()}`);
    console.log(`Deployer Secret Key: ${deployer.secret()}`);

    console.log("Funding deployer account via Friendbot...");
    const friendbotUrl = `https://friendbot.stellar.org?addr=${deployer.publicKey()}`;
    const fbRes = await fetch(friendbotUrl);
    if (!fbRes.ok) {
        throw new Error("Failed to fund deployer account");
    }
    console.log("Funded successfully!");

    async function pollTx(hash) {
        for (let i = 0; i < 30; i++) {
            const status = await server.getTransaction(hash);
            if (status.status === "SUCCESS") return status;
            if (status.status === "FAILED") {
                throw new Error(`Tx failed: ${JSON.stringify(status, null, 2)}`);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error("Timeout waiting for tx");
    }

    async function deployContract(wasmPath) {
        console.log(`\nDeploying ${path.basename(wasmPath)}...`);
        const wasm = fs.readFileSync(wasmPath);
        
        let account = await server.getAccount(deployer.publicKey());
        
        // 1. Upload WASM
        console.log("Uploading WASM...");
        let tx = new TransactionBuilder(account, {
            fee: "100000",
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(Operation.uploadContractWasm({
            wasm: wasm
        }))
        .setTimeout(30)
        .build();

        const simUpload = await server.simulateTransaction(tx);
        if (rpc.Api.isSimulationError(simUpload)) throw new Error("Simulate upload failed: " + simUpload.error);
        
        const prepUploadTx = rpc.assembleTransaction(tx, simUpload).build();
        prepUploadTx.sign(deployer);
        
        let sendUpload = await server.sendTransaction(prepUploadTx);
        if (sendUpload.status === "ERROR") {
            console.log("Upload Error:", JSON.stringify(sendUpload, null, 2));
            throw new Error(`Upload failed`);
        }
        
        let uploadResult = await pollTx(sendUpload.hash);
        const wasmId = uploadResult.returnValue.bytes().toString("hex");
        console.log(`Uploaded WASM ID: ${wasmId}`);

        // 2. Create Contract
        console.log("Creating Contract instance...");
        account = await server.getAccount(deployer.publicKey());
        const createTx = new TransactionBuilder(account, {
            fee: "100000",
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(Operation.createCustomContract({
            address: new Address(deployer.publicKey()),
            wasmHash: Buffer.from(wasmId, "hex")
        }))
        .setTimeout(30)
        .build();

        const simCreate = await server.simulateTransaction(createTx);
        if (rpc.Api.isSimulationError(simCreate)) throw new Error("Simulate create failed: " + simCreate.error);

        const prepCreateTx = rpc.assembleTransaction(createTx, simCreate).build();
        prepCreateTx.sign(deployer);

        let sendCreate = await server.sendTransaction(prepCreateTx);
        if (sendCreate.status === "ERROR") {
            console.log("Create Error XDR:", sendCreate.errorResultXdr);
            throw new Error(`Create failed`);
        }

        let createResult = await pollTx(sendCreate.hash);
        const contractId = scValToNative(createResult.returnValue);
        console.log(`Deployed Contract ID: ${contractId}`);
        return contractId;
    }
    
    try {
        const vaultWasm = path.join(__dirname, "../target/wasm32-unknown-unknown/release/vault.wasm");
        const routerWasm = path.join(__dirname, "../target/wasm32-unknown-unknown/release/router.wasm");

        const vaultId = await deployContract(vaultWasm);
        const routerId = await deployContract(routerWasm);

        console.log("\n--- DEPLOYMENT SUCCESS ---");
        console.log(`NEXT_PUBLIC_SOROBAN_VAULT="${vaultId}"`);
        console.log(`NEXT_PUBLIC_SOROBAN_ROUTER="${routerId}"`);
        
        // Write to env
        const envPath = path.join(__dirname, "../../../apps/web/.env.local");
        let envContent = "";
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, "utf-8");
        }
        
        envContent = envContent.replace(/^NEXT_PUBLIC_SOROBAN_VAULT=.*$/m, "");
        envContent = envContent.replace(/^NEXT_PUBLIC_SOROBAN_ROUTER=.*$/m, "");
        envContent += `\nNEXT_PUBLIC_SOROBAN_VAULT="${vaultId}"\nNEXT_PUBLIC_SOROBAN_ROUTER="${routerId}"\n`;
        
        fs.writeFileSync(envPath, envContent.trim() + "\n");
        console.log("Updated apps/web/.env.local");

    } catch (e) {
        console.error(e);
    }
}

deploy();
