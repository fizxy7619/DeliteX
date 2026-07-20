#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env,
};

#[contracttype]
pub enum DataKey {
    VaultId,
    Admin,
}

mod vault {
    soroban_sdk::contractimport!(
        file = "../target/wasm32-unknown-unknown/release/vault.wasm"
    );
}

#[contract]
pub struct PaymentRouter;

#[contractimpl]
impl PaymentRouter {
    pub fn initialize(env: Env, admin: Address, vault_id: Address) {
        if env.storage().instance().has(&DataKey::VaultId) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::VaultId, &vault_id);
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn allocate(env: Env, user: Address, total_amount: i128, savings_percent: u32) {
        user.require_auth();
        if savings_percent > 100 {
            panic!("invalid percentage");
        }

        let savings_amount = (total_amount * (savings_percent as i128)) / 100;
        
        if savings_amount > 0 {
            let vault_id: Address = env.storage().instance().get(&DataKey::VaultId).unwrap();
            let vault_client = vault::Client::new(&env, &vault_id);
            vault_client.deposit(&user, &user, &savings_amount);
        }

        env.events().publish(
            (symbol_short!("Alloc"), user),
            (total_amount, savings_amount),
        );
    }
}

