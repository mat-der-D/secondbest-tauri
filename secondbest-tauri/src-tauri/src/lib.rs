mod api;
mod game;
mod game_engine;

use api::GameEngineState;
use game_engine::GameEngine;
use std::sync::{Arc, Mutex};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // ゲームエンジンの初期化
    let game_engine: GameEngineState = Arc::new(Mutex::new(GameEngine::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(game_engine)
        .invoke_handler(tauri::generate_handler![
            greet,
            // ゲーム管理API
            api::new_game,
            api::get_game_state,
            api::get_legal_moves,
            // プレイヤーアクションAPI
            api::make_move,
            api::declare_second_best,
            // ゲーム情報API
            api::check_winner,
            api::get_position_stack,
            api::can_declare_second_best,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
