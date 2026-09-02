#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Env,
};

#[test]
fn adds_reputation() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ReputationContract, ());
    let client = ReputationContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    let score = client.add_reputation(&user, &10);

    assert_eq!(score, 10);
    assert_eq!(client.get_reputation(&user), 10);
}

#[test]
fn reputation_accumulates() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ReputationContract, ());
    let client = ReputationContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    client.add_reputation(&user, &10);
    let score = client.add_reputation(&user, &15);

    assert_eq!(score, 25);
    assert_eq!(client.get_reputation(&user), 25);
}

#[test]
fn new_user_starts_with_zero_reputation() {
    let env = Env::default();

    let contract_id = env.register(ReputationContract, ());
    let client = ReputationContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    assert_eq!(client.get_reputation(&user), 0);
}