use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Position {
    N,
    NE,
    E,
    SE,
    S,
    SW,
    W,
    NW,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Player {
    Black,
    White,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PieceStack {
    pub pieces: Vec<Player>, // 最大3個まで、先頭が一番下
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TurnPhase {
    WaitingForMove,       // 通常の手番待ち
    WaitingForSecondBest, // Second Best宣言待ち
    WaitingForSecondMove, // Second Best後の代替手待ち
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub board: HashMap<Position, PieceStack>,
    pub current_player: Player,
    pub turn_phase: TurnPhase,
    pub second_best_available: bool,
    pub winner: Option<Player>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MoveAction {
    Place { position: Position, player: Player },
    Move { from: Position, to: Position },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GameOverReason {
    VerticalLineup,
    HorizontalLineup,
    NoMoves,
}

// Push型APIのイベント構造体
#[derive(Debug, Clone, Serialize)]
pub struct AiMoveEvent {
    pub action: MoveAction,
    pub new_state: GameState,
}

#[derive(Debug, Clone, Serialize)]
pub struct AiSecondBestEvent {
    pub new_state: GameState,
}

#[derive(Debug, Clone, Serialize)]
pub struct AiSecondMoveEvent {
    pub action: MoveAction,
    pub new_state: GameState,
}

#[derive(Debug, Clone, Serialize)]
pub struct GameOverEvent {
    pub winner: Option<Player>,
    pub reason: GameOverReason,
}

#[derive(Debug, Clone, Serialize)]
pub struct TurnPhaseEvent {
    pub new_phase: TurnPhase,
    pub current_player: Player,
}

#[derive(Debug, Clone, Serialize)]
pub struct AiErrorEvent {
    pub message: String,
}
