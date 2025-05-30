# Second Best Game - バックエンド API 実装

## 実装概要

`docs/backend_api.md` の仕様に従って、Tauri バックエンド API を実装しました。
内部実装はダミーとなっており、API の表面のみが実装されています。

## 実装ファイル

### Rust バックエンド (src-tauri/src/)

1. **`game.rs`** - ゲームのデータ構造とタイプ定義

   - `Position`, `Player`, `PieceStack`, `GameState`, `TurnPhase`, `MoveAction`
   - Push 型 API 用イベント構造体

2. **`game_engine.rs`** - ゲームエンジン（ダミー実装）

   - ゲーム状態管理
   - AI 動作シミュレーション
   - イベント発火

3. **`api.rs`** - Pull 型 API（Tauri commands）

   - ゲーム管理 API
   - プレイヤーアクション API
   - ゲーム情報 API

4. **`lib.rs`** - メインエントリーポイント
   - モジュール統合
   - Tauri アプリケーション設定

### TypeScript フロントエンド (src/)

1. **`types/game.ts`** - TypeScript 型定義

   - Rust 構造体に対応する TypeScript 型
   - フロントエンド用インターフェース

2. **`lib/gameApi.ts`** - API ヘルパー関数
   - Pull 型 API 呼び出しクラス
   - Push 型 API イベントリスナー
   - 使用例

## API 仕様

### Pull 型 API（invoke 関数）

#### ゲーム管理

- `new_game()` - 新しいゲームを開始
- `get_game_state()` - 現在のゲーム状態を取得
- `get_legal_moves()` - 合法手を取得

#### プレイヤーアクション

- `make_move(action)` - プレイヤーの手を実行
- `declare_second_best()` - Second Best 宣言

#### ゲーム情報

- `check_winner()` - 勝者チェック
- `get_position_stack(position)` - 位置のピーススタック取得
- `can_declare_second_best()` - Second Best 宣言可能性チェック

### Push 型 API（イベント）

- `ai_move_completed` - AI 手完了
- `ai_second_best_declared` - AI Second Best 宣言
- `ai_second_move_completed` - AI 代替手完了
- `game_over` - ゲーム終了
- `turn_phase_changed` - ターンフェーズ変更
- `ai_error` - AI エラー

## 使用方法

### フロントエンドでの使用例

```typescript
import { GameAPI, GameEventListeners } from "./lib/gameApi";
import { Position } from "./types/game";

// 新しいゲームを開始
const gameState = await GameAPI.newGame();

// プレイヤーの手を実行
const moveAction = { Place: { position: Position.N } };
await GameAPI.makeMove(moveAction);

// イベントリスナーを設定
GameEventListeners.onAiMoveCompleted((event) => {
  console.log("AIの手:", event);
  // UI更新ロジック
});
```

## ダミー実装の詳細

### ゲームエンジン

- 固定の合法手リストを返却
- プレイヤーの手は常に受け入れ、ボードに配置
- AI は 1 秒後に固定位置に配置する手を実行
- Second Best 宣言は基本的に受け入れ

### AI 動作

- `simulate_ai_move()` - 1 秒待機後、NE 位置に配置
- `simulate_ai_second_move()` - 1 秒待機後、SW 位置に配置
- すべて非同期で実行され、イベントで通知

### 状態管理

- `Arc<Mutex<GameState>>` でスレッドセーフな状態管理
- 各 API 呼び出しで状態の読み書きを実行

## 実装されていない部分

以下の部分は実際のゲームロジック実装時に追加が必要です：

1. **ゲームルール**

   - 合法手判定ロジック
   - 勝利条件チェック
   - ピーススタック管理

2. **AI 実装**

   - 実際の思考アルゴリズム
   - Second Best 宣言タイミング
   - 難易度調整

3. **バリデーション**
   - 不正な手のチェック
   - ゲーム状態整合性確認
   - エラーハンドリング強化

## ビルドとテスト

```bash
# バックエンドのコンパイルチェック
cd src-tauri
cargo check

# 完全なビルド
npm run tauri build

# 開発モード実行
npm run tauri dev
```

この API 実装により、フロントエンド開発者は実際のゲームロジックの実装を待たずに、UI と API の統合を進めることができます。
