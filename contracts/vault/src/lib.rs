#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env,
};

#[contracttype]
pub enum DataKey {
    TokenId,
    Admin,
    Balance(Address),
}

#[contract]
pub struct YieldVault;

#[contractimpl]
impl YieldVault {
    pub fn initialize(env: Env, admin: Address, token_id: Address) {
        if env.storage().instance().has(&DataKey::TokenId) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::TokenId, &token_id);
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn deposit(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        let token_id: Address = env.storage().instance().get(&DataKey::TokenId).unwrap();
        let token = token::Client::new(&env, &token_id);
        
        // Transfer from `from` to the vault
        token.transfer(&from, &env.current_contract_address(), &amount);

        // Update balances for `to`
        let mut balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(to.clone()))
            .unwrap_or(0);
        
        balance += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &balance);
            
        env.events().publish((symbol_short!("Deposit"), to), amount);
    }

    pub fn withdraw(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let token_id: Address = env.storage().instance().get(&DataKey::TokenId).unwrap();
        let token = token::Client::new(&env, &token_id);
        
        let mut balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);
        
        if amount > balance {
            panic!();
        }
        
        balance -= amount;
        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &balance);
            
        // Transfer from vault back to the user
        token.transfer(&env.current_contract_address(), &from, &amount);
        
        env.events().publish((symbol_short!("Withdraw"), from.clone()), amount);
    }

    pub fn balance(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(user))
            .unwrap_or(0)
    }
}

