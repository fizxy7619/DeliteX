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

    pub fn balance(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(user))
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};
    use soroban_sdk::token::Client as TokenClient;
    use soroban_sdk::token::StellarAssetClient as TokenAdminClient;

    #[test]
    fn test_deposit() {
        let env = Env::default();
        env.mock_all_auths();

        let vault_id = env.register_contract(None, YieldVault);
        let vault_client = YieldVaultClient::new(&env, &vault_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        let token_id = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let token_admin = TokenAdminClient::new(&env, &token_id);
        let token = TokenClient::new(&env, &token_id);

        vault_client.initialize(&admin, &token_id);
        token_admin.mint(&user, &1000);

        vault_client.deposit(&user, &user, &500);

        assert_eq!(vault_client.balance(&user), 500);
        assert_eq!(token.balance(&vault_id), 500);
        assert_eq!(token.balance(&user), 500);
    }
}
