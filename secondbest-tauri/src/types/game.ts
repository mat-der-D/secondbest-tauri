// Second Best Game - フロントエンド型定義

export enum Position {
  N = "N",
  NE = "NE", 
  E = "E",
  SE = "SE",
  S = "S",
  SW = "SW",
  W = "W", 
  NW = "NW"
}

export enum Player {
  Black = "Black",
  White = "White"
}

export interface PieceStack {
  pieces: Player[]; // 最大3個まで、先頭が一番下
}

export enum TurnPhase {
  WaitingForMove = "WaitingForMove",           // 通常の手番待ち
  WaitingForSecondBest = "WaitingForSecondBest", // Second Best宣言待ち
  WaitingForSecondMove = "WaitingForSecondMove"   // Second Best後の代替手待ち
}

export interface GameState {
  board: Record<Position, PieceStack>;
  current_player: Player;
  turn_phase: TurnPhase;
  second_best_available: boolean;
  winner?: Player;
}

export type MoveAction = 
  | { Place: { position: Position; player: Player } }
  | { Move: { from: Position; to: Position } };

export enum GameOverReason {
  VerticalLineup = "VerticalLineup",
  HorizontalLineup = "HorizontalLineup",
  NoMoves = "NoMoves"
}

// Push型APIのイベント構造体
export interface AiMoveEvent {
  action: MoveAction;
  new_state: GameState;
}

export interface AiSecondBestEvent {
  new_state: GameState;
}

export interface AiSecondMoveEvent {
  action: MoveAction;
  new_state: GameState;
}

export interface GameOverEvent {
  winner?: Player;
  reason: GameOverReason;
}

export interface TurnPhaseEvent {
  new_phase: TurnPhase;
  current_player: Player;
}

export interface AiErrorEvent {
  message: string;
}

// Pull型API関数の型定義
export interface GameAPI {
  // ゲーム管理
  new_game(): Promise<GameState>;
  get_game_state(): Promise<GameState>;
  get_legal_moves(): Promise<MoveAction[]>;
  
  // プレイヤーアクション
  make_move(action: MoveAction): Promise<GameState>;
  declare_second_best(): Promise<GameState>;
  
  // ゲーム情報
  check_winner(): Promise<Player | null>;
  get_position_stack(position: Position): Promise<PieceStack>;
  can_declare_second_best(): Promise<boolean>;
} 