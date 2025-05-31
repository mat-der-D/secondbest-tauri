use crate::game::*;
use secondbest::prelude as sblib;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};
use tauri::{AppHandle, Emitter};

// 各種変換関数
impl From<sblib::Color> for Player {
    fn from(value: sblib::Color) -> Self {
        match value {
            sblib::Color::B => Player::Black,
            sblib::Color::W => Player::White,
        }
    }
}

impl From<Player> for sblib::Color {
    fn from(value: Player) -> Self {
        match value {
            Player::Black => sblib::Color::B,
            Player::White => sblib::Color::W,
        }
    }
}

impl From<sblib::Position> for Position {
    fn from(value: sblib::Position) -> Self {
        match value {
            sblib::Position::N => Position::N,
            sblib::Position::NE => Position::NE,
            sblib::Position::E => Position::E,
            sblib::Position::SE => Position::SE,
            sblib::Position::S => Position::S,
            sblib::Position::SW => Position::SW,
            sblib::Position::W => Position::W,
            sblib::Position::NW => Position::NW,
        }
    }
}

impl From<Position> for sblib::Position {
    fn from(value: Position) -> Self {
        match value {
            Position::N => sblib::Position::N,
            Position::NE => sblib::Position::NE,
            Position::E => sblib::Position::E,
            Position::SE => sblib::Position::SE,
            Position::S => sblib::Position::S,
            Position::SW => sblib::Position::SW,
            Position::W => sblib::Position::W,
            Position::NW => sblib::Position::NW,
        }
    }
}

impl From<sblib::Action> for MoveAction {
    fn from(value: sblib::Action) -> Self {
        match value {
            sblib::Action::Put(position, player) => MoveAction::Place {
                position: position.into(),
                player: player.into(),
            },
            sblib::Action::Move(from, to) => MoveAction::Move {
                from: from.into(),
                to: to.into(),
            },
        }
    }
}

impl From<MoveAction> for sblib::Action {
    fn from(value: MoveAction) -> Self {
        match value {
            MoveAction::Place { position, player } => {
                sblib::Action::Put(position.into(), player.into())
            }
            MoveAction::Move { from, to } => sblib::Action::Move(from.into(), to.into()),
        }
    }
}

fn create_board(board: &sblib::Board) -> HashMap<Position, PieceStack> {
    let mut board_map = HashMap::new();
    for pos in sblib::Position::iter() {
        let pieces = board.get_pieces_at(pos);
        let piece_stack = PieceStack {
            pieces: pieces.into_iter().map(|c| c.into()).collect(),
        };
        board_map.insert(pos.into(), piece_stack);
    }
    board_map
}

fn create_game_state(game: &sblib::Game) -> GameState {
    GameState {
        board: create_board(game.board()),
        current_player: game.current_player().into(),
        turn_phase: TurnPhase::WaitingForMove, // TODO: 適切に設定する
        second_best_available: game.can_declare_second_best(),
        winner: game.result().winner().map(|c| c.into()),
    }
}

// GameEngine の実装
pub struct GameEngine {
    state: Arc<Mutex<sblib::Game>>,
}

impl GameEngine {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(sblib::Game::new())),
        }
    }

    pub fn new_game(&self) -> GameState {
        let mut game = self.state.lock().unwrap();
        *game = sblib::Game::new();
        create_game_state(&game)
        // TODO: プレイヤーが白の場合はAIの手が続く
    }

    pub fn get_game_state(&self) -> GameState {
        let game = self.state.lock().unwrap();
        create_game_state(&game)
    }

    pub fn get_legal_moves(&self) -> Vec<MoveAction> {
        let game = self.state.lock().unwrap();
        game.legal_actions().iter().map(|&a| a.into()).collect()
    }

    pub fn make_move(
        &self,
        action: MoveAction,
        app_handle: &AppHandle,
    ) -> Result<GameState, String> {
        let mut game = self.state.lock().unwrap();
        let Ok(_) = game.apply_action(action.into()) else {
            return Err("この手は実行できません。".to_string());
        };

        let new_state = create_game_state(&game);
        if game.is_in_progress() {
            self.simulate_ai_move(app_handle); // 非同期に実行
        }

        Ok(new_state)
    }

    pub fn declare_second_best(&self, app_handle: &AppHandle) -> Result<GameState, String> {
        let mut game = self.state.lock().unwrap();
        if !game.can_declare_second_best() {
            return Err("Second Best宣言は現在利用できません".to_string());
        }
        game.declare_second_best().unwrap();

        let new_state = create_game_state(&game);
        if game.is_in_progress() {
            self.simulate_ai_second_move(app_handle); // 非同期に実行
        }

        Ok(new_state)
    }

    pub fn check_winner(&self) -> Option<Player> {
        let game = self.state.lock().unwrap();
        game.result().winner().map(|p| p.into())
    }

    pub fn get_position_stack(&self, position: Position) -> PieceStack {
        let game = self.state.lock().unwrap();
        let pieces = game
            .board()
            .get_pieces_at(position.into())
            .into_iter()
            .map(|c| c.into())
            .collect();
        PieceStack { pieces }
    }

    pub fn can_declare_second_best(&self) -> bool {
        let game = self.state.lock().unwrap();
        game.can_declare_second_best()
    }

    fn simulate_ai_move(&self, app_handle: &AppHandle) {
        let app_handle = app_handle.clone();
        let state = self.state.clone();

        std::thread::spawn(move || {
            let mut game = state.lock().unwrap();
            std::thread::sleep(std::time::Duration::from_secs(10));

            if game.can_declare_second_best() {
                game.declare_second_best().unwrap();
                Self::emit_ai_second_best_declared(&app_handle, &game);
                return;
            }
            let legal_actions = game.legal_actions();
            if legal_actions.is_empty() {
                return;
            }
            let ai_action = legal_actions[0];
            game.apply_action(ai_action).unwrap();
            Self::emit_ai_move_completed(&app_handle, ai_action, &game);
        });
    }

    fn simulate_ai_second_move(&self, app_handle: &AppHandle) {
        let app_handle = app_handle.clone();
        let state = self.state.clone();

        std::thread::spawn(move || {
            let mut game = state.lock().unwrap();

            std::thread::sleep(std::time::Duration::from_secs(10));

            if game.can_declare_second_best() {
                panic!(); // ここに来るのは一回目だけのはず
            }
            let legal_actions = game.legal_actions();
            if legal_actions.is_empty() {
                return; // ゲーム終了しているはず
            }
            let ai_action = legal_actions[0];
            game.apply_action(ai_action).unwrap();
            Self::emit_second_move_completed(&app_handle, ai_action, &game);
        });
    }

    fn emit_ai_move_completed(
        app_handle: &AppHandle,
        ai_action: sblib::Action,
        game: &sblib::Game,
    ) {
        let action = ai_action.into();
        let new_state = create_game_state(game);
        let _ = app_handle.emit("ai_move_completed", AiMoveEvent { action, new_state });
    }

    fn emit_ai_second_best_declared(app_handle: &AppHandle, game: &sblib::Game) {
        let new_state = create_game_state(game);
        let _ = app_handle.emit("ai_second_best_declared", AiSecondBestEvent { new_state });
    }

    fn emit_second_move_completed(
        app_handle: &AppHandle,
        ai_action: sblib::Action,
        game: &sblib::Game,
    ) {
        let action = ai_action.into();
        let new_state = create_game_state(game);
        let _ = app_handle.emit(
            "ai_second_move_completed",
            AiSecondMoveEvent { action, new_state },
        );
    }
}
