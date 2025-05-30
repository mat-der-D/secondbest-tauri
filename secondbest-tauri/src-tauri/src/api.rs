use crate::game::*;
use crate::game_engine::GameEngine;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, State};

pub type GameEngineState = Arc<Mutex<GameEngine>>;

// ゲーム管理
#[tauri::command]
pub fn new_game(state: State<GameEngineState>) -> GameState {
    let engine = state.lock().unwrap();
    engine.new_game()
}

#[tauri::command]
pub fn get_game_state(state: State<GameEngineState>) -> GameState {
    let engine = state.lock().unwrap();
    engine.get_game_state()
}

#[tauri::command]
pub fn get_legal_moves(state: State<GameEngineState>) -> Vec<MoveAction> {
    let engine = state.lock().unwrap();
    engine.get_legal_moves()
}

// プレイヤーアクション
#[tauri::command]
pub fn make_move(
    action: MoveAction,
    state: State<GameEngineState>,
    app_handle: AppHandle,
) -> Result<GameState, String> {
    let engine = state.lock().unwrap();
    engine.make_move(action, &app_handle)
}

#[tauri::command]
pub fn declare_second_best(
    state: State<GameEngineState>,
    app_handle: AppHandle,
) -> Result<GameState, String> {
    let engine = state.lock().unwrap();
    engine.declare_second_best(&app_handle)
}

// ゲーム情報
#[tauri::command]
pub fn check_winner(state: State<GameEngineState>) -> Option<Player> {
    let engine = state.lock().unwrap();
    engine.check_winner()
}

#[tauri::command]
pub fn get_position_stack(position: Position, state: State<GameEngineState>) -> PieceStack {
    let engine = state.lock().unwrap();
    engine.get_position_stack(position)
}

#[tauri::command]
pub fn can_declare_second_best(state: State<GameEngineState>) -> bool {
    let engine = state.lock().unwrap();
    engine.can_declare_second_best()
}
