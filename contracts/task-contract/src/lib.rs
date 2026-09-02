#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype,
    vec, Address, Env, IntoVal, String, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub struct Task {
    pub id: u32,
    pub creator: Address,
    pub title: String,
    pub completed: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextTaskId,
    Task(u32),
    ReputationContract,
}

#[contractevent]
#[derive(Clone)]
pub struct TaskCreated {
    #[topic]
    pub task_id: u32,
    #[topic]
    pub creator: Address,
    pub title: String,
}

#[contractevent]
#[derive(Clone)]
pub struct TaskCompleted {
    #[topic]
    pub task_id: u32,
    #[topic]
    pub creator: Address,
}

#[contract]
pub struct TaskContract;

#[contractimpl]
impl TaskContract {
    pub fn initialize(env: Env, reputation_contract: Address) {
        if env
            .storage()
            .instance()
            .has(&DataKey::ReputationContract)
        {
            panic!("Contract already initialized");
        }

        env.storage()
            .instance()
            .set(&DataKey::ReputationContract, &reputation_contract);

        env.storage()
            .instance()
            .set(&DataKey::NextTaskId, &1u32);
    }

    pub fn create_task(env: Env, creator: Address, title: String) -> u32 {
        creator.require_auth();

        let task_id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::NextTaskId)
            .unwrap_or(1);

        let task = Task {
            id: task_id,
            creator: creator.clone(),
            title: title.clone(),
            completed: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Task(task_id), &task);

        env.storage()
            .instance()
            .set(&DataKey::NextTaskId, &(task_id + 1));

        TaskCreated {
            task_id,
            creator,
            title,
        }
        .publish(&env);

        task_id
    }

    pub fn complete_task(env: Env, creator: Address, task_id: u32) {
        creator.require_auth();

        let key = DataKey::Task(task_id);

        let mut task: Task = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Task not found"));

        if task.creator != creator {
            panic!("Only task creator can complete this task");
        }

        if task.completed {
            panic!("Task already completed");
        }

        task.completed = true;

        env.storage()
            .persistent()
            .set(&key, &task);

        let reputation_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::ReputationContract)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        let function = Symbol::new(&env, "add_reputation");

        env.invoke_contract::<u32>(
            &reputation_contract,
            &function,
            vec![
                &env,
                creator.clone().into_val(&env),
                10u32.into_val(&env),
            ],
        );

        TaskCompleted {
            task_id,
            creator,
        }
        .publish(&env);
    }

    pub fn get_task(env: Env, task_id: u32) -> Task {
        env.storage()
            .persistent()
            .get(&DataKey::Task(task_id))
            .unwrap_or_else(|| panic!("Task not found"))
    }

    pub fn get_next_task_id(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::NextTaskId)
            .unwrap_or(1)
    }

    pub fn get_reputation_contract(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::ReputationContract)
            .unwrap_or_else(|| panic!("Contract not initialized"))
    }
}

mod test;