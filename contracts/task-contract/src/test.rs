#![cfg(test)]

use super::*;
use reputation_contract::{
    ReputationContract,
    ReputationContractClient,
};
use soroban_sdk::{
    testutils::Address as _,
    Address, Env, String,
};

#[test]
fn creates_task() {
    let env = Env::default();
    env.mock_all_auths();

    let reputation_id = env.register(ReputationContract, ());

    let task_contract_id = env.register(TaskContract, ());
    let task_client = TaskContractClient::new(&env, &task_contract_id);

    task_client.initialize(&reputation_id);

    let user = Address::generate(&env);
    let title = String::from_str(&env, "Build Stellar dApp");

    let task_id = task_client.create_task(&user, &title);

    assert_eq!(task_id, 1);

    let task = task_client.get_task(&task_id);

    assert_eq!(task.id, 1);
    assert_eq!(task.creator, user);
    assert_eq!(task.title, title);
    assert!(!task.completed);
}

#[test]
fn completing_task_marks_it_completed() {
    let env = Env::default();
    env.mock_all_auths();

    let reputation_id = env.register(ReputationContract, ());

    let task_contract_id = env.register(TaskContract, ());
    let task_client = TaskContractClient::new(&env, &task_contract_id);

    task_client.initialize(&reputation_id);

    let user = Address::generate(&env);
    let title = String::from_str(&env, "Complete Level 3");

    let task_id = task_client.create_task(&user, &title);

    task_client.complete_task(&user, &task_id);

    let task = task_client.get_task(&task_id);

    assert!(task.completed);
}

#[test]
fn completing_task_updates_reputation_contract() {
    let env = Env::default();
    env.mock_all_auths();

    let reputation_id = env.register(ReputationContract, ());
    let reputation_client =
        ReputationContractClient::new(&env, &reputation_id);

    let task_contract_id = env.register(TaskContract, ());
    let task_client =
        TaskContractClient::new(&env, &task_contract_id);

    task_client.initialize(&reputation_id);

    let user = Address::generate(&env);
    let title = String::from_str(
        &env,
        "Test inter-contract communication",
    );

    let task_id = task_client.create_task(&user, &title);

    assert_eq!(
        reputation_client.get_reputation(&user),
        0
    );

    task_client.complete_task(&user, &task_id);

    assert_eq!(
        reputation_client.get_reputation(&user),
        10
    );
}