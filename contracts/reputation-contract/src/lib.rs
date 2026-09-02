#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype,
    Address, Env,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Reputation(Address),
}

#[contractevent]
#[derive(Clone)]
pub struct ReputationUpdated {
    #[topic]
    pub user: Address,
    pub new_score: u32,
}

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    pub fn add_reputation(env: Env, user: Address, amount: u32) -> u32 {
        user.require_auth();

        let key = DataKey::Reputation(user.clone());

        let current_score: u32 = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(0);

        let new_score = current_score + amount;

        env.storage()
            .persistent()
            .set(&key, &new_score);

        ReputationUpdated {
            user,
            new_score,
        }
        .publish(&env);

        new_score
    }

    pub fn get_reputation(env: Env, user: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::Reputation(user))
            .unwrap_or(0)
    }
}

mod test;