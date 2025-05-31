# Second Best Game - Backend API 設計

## 概要

Second Best ゲームの Tauri アプリケーション用バックエンド API 設計書です。
プレイヤーと AI の対戦形式で、Pull+Push ハイブリッド型の通信を採用しています。

## データ構造

### Position

```rust
pub enum Position {
    N, NE, E, SE, S, SW, W, NW
}
```

### Player

```rust
pub enum Player {
    Black,
    White
}
```

### PieceStack

```rust
pub struct PieceStack {
    pieces: Vec<Player>,  // 最大3個まで、先頭が一番下
}
```

### GameState

```rust
pub struct GameState {
    board: HashMap<Position, PieceStack>,
    current_player: Player,
    turn_phase: TurnPhase,
    second_best_available: bool,
    winner: Option<Player>,
}
```

### TurnPhase

```rust
pub enum TurnPhase {
    WaitingForMove,           // 通常の手番待ち
    WaitingForSecondBest,     // Second Best宣言待ち
    WaitingForSecondMove,     // Second Best後の代替手待ち
}
```

### MoveAction

```rust
pub enum MoveAction {
    Place { position: Position, player: Player },
    Move { from: Position, to: Position },
}
```

## Pull 型 API (invoke 関数)

### ゲーム管理

#### `new_game() -> GameState`

- 新しいゲームを開始
- 空のボードで Black プレイヤーから開始

#### `get_game_state() -> GameState`

- 現在のゲーム状態を取得

#### `get_legal_moves() -> Vec<MoveAction>`

- 現在のプレイヤーが実行可能な合法手を取得

### プレイヤーアクション

#### `make_move(action: MoveAction) -> Result<GameState, String>`

- プレイヤーの手を実行
- 不正な手の場合はエラーを返す
- 成功時は更新されたゲーム状態を返す
- 合法な手が実行されると Second Best 宣言は失効

#### `declare_second_best() -> Result<GameState, String>`

- Second Best 宣言を実行
- 宣言不可能な状況ではエラーを返す
- 成功時は相手に代替手を要求する状態に遷移

### ゲーム情報

#### `check_winner() -> Option<Player>`

- 勝利条件をチェックして勝者を返す

#### `get_position_stack(position: Position) -> PieceStack`

- 指定位置のピーススタックを取得

#### `can_declare_second_best() -> bool`

- Second Best 宣言が可能かどうかを判定

## Push 型 API (emit イベント)

### AI アクション通知

#### `ai_move_completed`

```rust
pub struct AiMoveEvent {
    action: MoveAction,
    new_state: GameState,
}
```

- AI が手を完了した時に発火
- 実行された手と新しいゲーム状態を通知

#### `ai_second_best_declared`

```rust
pub struct AiSecondBestEvent {
    new_state: GameState,
}
```

- AI が Second Best 宣言を行った時に発火
- プレイヤーに代替手の選択を要求

#### `ai_second_move_completed`

```rust
pub struct AiSecondMoveEvent {
    action: MoveAction,
    new_state: GameState,
}
```

- AI が Second Best 後の代替手を完了した時に発火

### ゲーム状態変更通知

#### `game_over`

```rust
pub struct GameOverEvent {
    winner: Option<Player>,
    reason: GameOverReason,
}

pub enum GameOverReason {
    VerticalLineup,
    HorizontalLineup,
    NoMoves,
}
```

- ゲーム終了時に発火

#### `turn_phase_changed`

```rust
pub struct TurnPhaseEvent {
    new_phase: TurnPhase,
    current_player: Player,
}
```

- ターンフェーズが変更された時に発火

### エラー通知

#### `ai_error`

```rust
pub struct AiErrorEvent {
    message: String,
}
```

- AI 処理中にエラーが発生した時に発火

## 実装フロー

### 通常のプレイヤーターン

1. フロント: `get_legal_moves()` で合法手を取得
2. フロント: プレイヤーが手を選択
3. フロント: `make_move(action)` で手を実行
4. バック: AI ターンを開始、`ai_move_completed` イベントを発火
5. フロント: イベントを受信して UI 更新

### プレイヤーによる Second Best 使用時

1. フロント: AI の手実行後、`can_declare_second_best()` で宣言可能性確認
2. フロント: `declare_second_best()` を実行
3. バック: AI に代替手を要求、`ai_second_move_completed` イベントを発火
4. フロント: イベントを受信して UI 更新

### AI による Second Best 使用時

1. バック: プレイヤーの手実行後、AI が Second Best 宣言を決定
2. バック: `ai_second_best_declared` イベントを発火
3. フロント: イベントを受信し、プレイヤーに代替手選択を促す
4. フロント: プレイヤーが代替手を選択、`make_move(action)` で実行
5. フロント: 通常通り AI ターンに移行

## 注意事項

- すべての勝利条件チェックは Second Best 処理完了後に実行
- AI の思考時間は適切に制限し、無限ループを防止
- ゲーム状態の整合性は常にバックエンドで保証
- エラーハンドリングは適切に行い、フロントエンドに分かりやすいメッセージを提供
- 合法な手が実行されると Second Best 宣言は自動的に失効
