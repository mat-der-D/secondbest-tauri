use crate::game::*;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

pub struct GameEngine {
    state: Arc<Mutex<GameState>>,
}

impl GameEngine {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(GameState::new())),
        }
    }

    pub fn new_game(&self) -> GameState {
        let mut state = self.state.lock().unwrap();
        *state = GameState::new();
        state.clone()
    }

    pub fn get_game_state(&self) -> GameState {
        self.state.lock().unwrap().clone()
    }

    pub fn get_legal_moves(&self) -> Vec<MoveAction> {
        // ダミー実装：固定の合法手を返す
        vec![
            MoveAction::Place {
                position: Position::N,
            },
            MoveAction::Place {
                position: Position::E,
            },
            MoveAction::Place {
                position: Position::S,
            },
            MoveAction::Place {
                position: Position::W,
            },
        ]
    }

    pub fn make_move(
        &self,
        action: MoveAction,
        app_handle: &AppHandle,
    ) -> Result<GameState, String> {
        let mut state = self.state.lock().unwrap();

        // ダミー実装：とりあえず手を受け入れて状態を更新
        match action {
            MoveAction::Place { position } => {
                let mut stack = PieceStack::new();
                stack.pieces.push(state.current_player);
                state.board.insert(position, stack);
            }
            MoveAction::Move { from: _, to } => {
                let mut stack = PieceStack::new();
                stack.pieces.push(state.current_player);
                state.board.insert(to, stack);
            }
        }

        // プレイヤーを切り替え
        state.current_player = match state.current_player {
            Player::Black => Player::White,
            Player::White => Player::Black,
        };

        let new_state = state.clone();
        drop(state);

        // AIの手をシミュレート（非同期で実行）
        self.simulate_ai_move(app_handle, new_state.clone());

        Ok(new_state)
    }

    pub fn declare_second_best(&self, app_handle: &AppHandle) -> Result<GameState, String> {
        let mut state = self.state.lock().unwrap();

        if !state.second_best_available {
            return Err("Second Best宣言は現在利用できません".to_string());
        }

        state.turn_phase = TurnPhase::WaitingForSecondMove;
        state.second_best_available = false;

        let new_state = state.clone();
        drop(state);

        // AIに代替手を要求
        self.simulate_ai_second_move(app_handle, new_state.clone());

        Ok(new_state)
    }

    pub fn check_winner(&self) -> Option<Player> {
        // ダミー実装：勝者なし
        None
    }

    pub fn get_position_stack(&self, position: Position) -> PieceStack {
        let state = self.state.lock().unwrap();
        state
            .board
            .get(&position)
            .cloned()
            .unwrap_or_else(PieceStack::new)
    }

    pub fn can_declare_second_best(&self) -> bool {
        let state = self.state.lock().unwrap();
        state.second_best_available && state.turn_phase == TurnPhase::WaitingForSecondBest
    }

    // ダミーAI実装
    fn simulate_ai_move(&self, app_handle: &AppHandle, _current_state: GameState) {
        let app_handle = app_handle.clone();
        let state_arc = self.state.clone();

        // 非同期でAIの動作をシミュレート
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(1000)); // AIの思考時間

            // ダミーのAI手を生成
            let ai_action = MoveAction::Place {
                position: Position::NE,
            };

            // 状態を更新
            let current_state = {
                let mut state = state_arc.lock().unwrap();
                let mut stack = PieceStack::new();
                stack.pieces.push(state.current_player);
                state.board.insert(Position::NE, stack);

                state.current_player = match state.current_player {
                    Player::Black => Player::White,
                    Player::White => Player::Black,
                };
                state.second_best_available = true;
                state.turn_phase = TurnPhase::WaitingForSecondBest;
                state.clone()
            };

            // イベントを発火
            let _ = app_handle.emit(
                "ai_move_completed",
                AiMoveEvent {
                    action: ai_action,
                    new_state: current_state,
                },
            );
        });
    }

    fn simulate_ai_second_move(&self, app_handle: &AppHandle, _current_state: GameState) {
        let app_handle = app_handle.clone();
        let state_arc = self.state.clone();

        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(1000));

            let ai_action = MoveAction::Place {
                position: Position::SW,
            };

            let current_state = {
                let mut state = state_arc.lock().unwrap();
                let mut stack = PieceStack::new();
                stack.pieces.push(state.current_player);
                state.board.insert(Position::SW, stack);

                state.current_player = match state.current_player {
                    Player::Black => Player::White,
                    Player::White => Player::Black,
                };
                state.turn_phase = TurnPhase::WaitingForMove;
                state.clone()
            };

            let _ = app_handle.emit(
                "ai_second_move_completed",
                AiSecondMoveEvent {
                    action: ai_action,
                    new_state: current_state,
                },
            );
        });
    }

    #[allow(dead_code)]
    pub fn ai_declare_second_best(&self, app_handle: &AppHandle) {
        let state_arc = self.state.clone();
        let app_handle = app_handle.clone();

        std::thread::spawn(move || {
            let new_state = {
                let mut state = state_arc.lock().unwrap();
                state.turn_phase = TurnPhase::WaitingForSecondMove;
                state.clone()
            };

            let _ = app_handle.emit("ai_second_best_declared", AiSecondBestEvent { new_state });
        });
    }
}
