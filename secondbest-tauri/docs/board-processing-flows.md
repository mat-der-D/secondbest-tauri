# Board.tsx 処理フロー仕様書

## 概要

Board.tsx は、Second Best ボードゲームのメインボードコンポーネントです。8 つの位置に配置されたコマの描画、プレイヤーの操作処理、バックエンド API との連携を担当します。

## 状態管理

### 定義されている状態

- **pieces**: `Piece[]`

  - コマの位置情報を保持する配列
  - 各 Piece は `posIndex`（位置）、`heightIndex`（高さ）、`color`（色）を持つ

- **highlightedCells**: `number[]`

  - 強調表示するマス（位置）の配列
  - 合法手の表示や移動先候補の表示に使用

- **highlightedPieces**: `number[]`

  - 強調表示するコマ（一番上のコマ）の位置配列
  - 移動可能なコマの表示に使用

- **liftedPieces**: `number[]`

  - 浮上表示するコマの位置配列
  - 移動元として選択されたコマの視覚的フィードバック

- **clickCount**: `number`

  - クリック回数（開発用、本番では未使用）

- **showSecondBest**: `boolean`
  - "Second Best!"文字の表示フラグ
  - セカンドベスト宣言時の視覚的フィードバック

## 1. 最初の描画

### 初期化フロー

1. **コンポーネントマウント**

   - `useImageLoader`フックによる画像リソースの非同期読み込み
   - 初期状態の設定（テスト用のコマ配置）

2. **初期状態設定**

   ```typescript
   // 各マスに3つずつコマを配置（テスト用）
   // 偶数マス: 白→黒→白
   // 奇数マス: 黒→白→黒
   ```

3. **描画実行**

   - `useEffect`による描画処理の実行
   - 全画像の読み込み完了を待機
   - 描画関数の順次実行

4. **初期ハイライト表示**
   - ゲーム開始時の合法手を取得
   - プレイヤーが選択可能な選択肢をハイライト表示

### 描画順序

1. **背景描画** (`drawBackground`)

   - ボード画像の描画

2. **セル強調表示** (`drawHighlightedCells`)

   - `highlightedCells`配列に基づくマスの強調表示

3. **コマ描画** (`drawPieces`)

   - 全コマの描画
   - 浮上効果の適用（`liftedPieces`）
   - 各位置の最大高さマップの生成

4. **コマ枠描画** (`drawPieceFrames`)

   - `highlightedPieces`配列に基づく一番上のコマの枠表示

5. **セカンドベスト表示** (`drawSecondBest`)
   - `showSecondBest`フラグに基づく"Second Best!"文字の表示

## 2. プレイヤーのターンでの操作処理フロー

### 手番開始時の処理

1. **合法手の取得と表示**

   ```typescript
   // プレイヤーの手番開始時に実行
   const initializePlayerTurn = async () => {
     // バックエンド API から合法手を取得
     const legalMoves = await GameAPI.getLegalMoves();

     // 合法手に基づいてハイライト表示を更新
     updateHighlightsFromLegalMoves(legalMoves);
   };
   ```

2. **ハイライト表示の更新**
   - コマ配置が可能なマスを `highlightedCells` に設定
   - 移動可能なコマを `highlightedPieces` に設定
   - ユーザーに選択可能な選択肢を事前に提示

### 基本操作フロー

1. **ユーザー入力受付**

   - キャンバスクリックイベントの処理
   - クリック座標から posIndex の特定

2. **操作状態の管理**
   - **初期状態**: 合法手がハイライト表示済み
   - **コマ選択状態**: 移動元コマが選択済み、移動先候補をハイライト
   - **移動先選択状態**: 移動先を選択中

### 操作パターン

#### パターン 1: コマ配置

1. **手番開始時**
   - 配置可能なマスが `highlightedCells` で事前にハイライト表示
2. **配置マスをクリック**
   - ハイライト済みのマスから選択
   - 配置位置の確定
3. **バックエンド API への配置アクション送信**

   ```typescript
   await GameAPI.makeMove({
     Place: { position: clickedPosition, player: currentPlayer },
   });
   ```

4. **ハイライトのクリア**
   - アクション完了後、ハイライト表示をリセット

#### パターン 2: コマ移動

1. **手番開始時**

   - 移動可能なコマが `highlightedPieces` で事前にハイライト表示

2. **移動元コマをクリック**

   - ハイライト済みのコマから選択
   - `liftedPieces` に選択されたコマを追加（視覚的フィードバック）
   - 選択されたコマの移動先候補を `highlightedCells` に表示

3. **移動先マスをクリック**

   - ハイライト済みの移動先から選択
   - 移動の実行

   ```typescript
   await GameAPI.makeMove({
     Move: { from: sourcePosition, to: targetPosition },
   });
   ```

4. **ハイライトのクリア**
   - アクション完了後、すべてのハイライト表示をリセット

### 状態更新フロー

1. **アクション実行後**

   - バックエンドから新しいゲーム状態を受信
   - `pieces`状態の更新
   - 強調表示状態のリセット

2. **次の手番の準備**

   - 相手プレイヤーまたは AI の手番に移行
   - 必要に応じて次の合法手のハイライト表示

3. **視覚的フィードバック**
   - 操作中の状態表示（浮上、強調）
   - アニメーション効果の適用

## 3. バックエンドから Push 型通知が来たときの処理フロー

### イベントリスナーの設定

```typescript
// コンポーネントマウント時にイベントリスナーを設定
useEffect(() => {
  const setupListeners = async () => {
    // AI動作完了イベント
    await GameEventListeners.onAiMoveCompleted(handleAiMove);

    // AI Second Best宣言イベント
    await GameEventListeners.onAiSecondBestDeclared(handleAiSecondBest);

    // AI代替手完了イベント
    await GameEventListeners.onAiSecondMoveCompleted(handleAiSecondMove);

    // ゲーム終了イベント
    await GameEventListeners.onGameOver(handleGameOver);

    // ターンフェーズ変更イベント
    await GameEventListeners.onTurnPhaseChanged(handleTurnPhaseChange);
  };

  setupListeners();
}, []);
```

### 各イベントの処理

#### 1. AI 動作完了 (`AiMoveEvent`)

```typescript
const handleAiMove = (event: AiMoveEvent) => {
  // 新しいゲーム状態でボードを更新
  updateBoardFromGameState(event.new_state);

  // プレイヤーのターンに切り替え
  setCurrentPlayer(event.new_state.current_player);

  // プレイヤーの手番開始時のハイライト表示
  initializePlayerTurn();
};
```

#### 2. AI Second Best 宣言 (`AiSecondBestEvent`)

```typescript
const handleAiSecondBest = (event: AiSecondBestEvent) => {
  // "Second Best!"表示
  setShowSecondBest(true);

  // 一定時間後に非表示
  setTimeout(() => setShowSecondBest(false), 2000);

  // プレイヤーに代替手選択を促すUI表示
  // （前回の手を取り消し、別の手を選択させる）
  promptForAlternativeMove();

  // 代替手の選択肢をハイライト表示
  highlightAlternativeMoves();
};
```

#### 3. AI 代替手完了 (`AiSecondMoveEvent`)

```typescript
const handleAiSecondMove = (event: AiSecondMoveEvent) => {
  // ボード状態の更新
  updateBoardFromGameState(event.new_state);

  // 通常のターン進行に戻る
  setTurnPhase(TurnPhase.WaitingForMove);

  // 次の手番のハイライト表示
  initializePlayerTurn();
};
```

#### 4. ゲーム終了 (`GameOverEvent`)

```typescript
const handleGameOver = (event: GameOverEvent) => {
  // 勝者の表示
  displayWinner(event.winner);

  // ゲーム終了UI表示
  showGameOverDialog(event.reason);

  // 操作の無効化とハイライトのクリア
  disableUserInteraction();
  clearAllHighlights();
};
```

#### 5. ターンフェーズ変更 (`TurnPhaseEvent`)

```typescript
const handleTurnPhaseChange = (event: TurnPhaseEvent) => {
  // フェーズに応じたUI更新
  switch (event.new_phase) {
    case TurnPhase.WaitingForMove:
      enableNormalMoveUI();
      initializePlayerTurn(); // 合法手のハイライト表示
      break;
    case TurnPhase.WaitingForSecondBest:
      showSecondBestOption();
      break;
    case TurnPhase.WaitingForSecondMove:
      promptForAlternativeMove();
      highlightAlternativeMoves(); // 代替手のハイライト表示
      break;
  }
};
```

### 状態同期フロー

1. **Push 通知受信**

   - バックエンドからのイベント受信
   - イベントタイプに応じたハンドラー実行

2. **状態更新**

   - `pieces`配列の更新
   - ゲーム状態の同期
   - UI 状態の更新

3. **再描画**
   - `useEffect`による自動再描画
   - 新しい状態に基づく視覚的更新

## 4. 新たに実装が必要な関数

### ハイライト管理関数

#### `updateHighlightsFromLegalMoves(legalMoves: MoveAction[])`

- **目的**: 合法手の配列からハイライト表示を更新
- **処理内容**:
  - 配置可能な位置を `highlightedCells` に設定
  - 移動可能なコマを `highlightedPieces` に設定
- **呼び出しタイミング**: 手番開始時、ターンフェーズ変更時

#### `highlightMovementDestinations(fromPosition: Position)`

- **目的**: 指定されたコマの移動先候補をハイライト表示
- **処理内容**:
  - 選択されたコマから移動可能な位置を計算
  - `highlightedCells` を移動先候補で更新
- **呼び出しタイミング**: コマ選択時

#### `clearAllHighlights()`

- **目的**: すべてのハイライト表示をクリア
- **処理内容**:
  - `highlightedCells` を空配列に設定
  - `highlightedPieces` を空配列に設定
  - `liftedPieces` を空配列に設定
- **呼び出しタイミング**: アクション完了後、ゲーム終了時

### ゲーム状態管理関数

#### `initializePlayerTurn()`

- **目的**: プレイヤーの手番開始時の初期化処理
- **処理内容**:
  - 合法手の取得
  - ハイライト表示の更新
  - UI 状態の初期化
- **呼び出しタイミング**: AI 動作完了後、ターンフェーズ変更時

#### `updateBoardFromGameState(gameState: GameState)`

- **目的**: バックエンドから受信したゲーム状態でボードを更新
- **処理内容**:
  - `pieces` 配列の更新
  - ボード状態の同期
  - 必要に応じて再描画のトリガー
- **呼び出しタイミング**: Push 通知受信時

#### `promptForAlternativeMove()`

- **目的**: Second Best 宣言後の代替手選択 UI 表示
- **処理内容**:
  - 前回の手の取り消し
  - 代替手選択のための UI 表示
  - ユーザーガイダンスの表示
- **呼び出しタイミング**: AI Second Best 宣言時

#### `highlightAlternativeMoves()`

- **目的**: Second Best 後の代替手選択肢をハイライト表示
- **処理内容**:
  - 前回選択した手以外の合法手を取得
  - 代替手の選択肢をハイライト表示
- **呼び出しタイミング**: Second Best 宣言後

### UI 制御関数

#### `enableNormalMoveUI()`

- **目的**: 通常の手番時の UI 状態に設定
- **処理内容**:
  - ユーザー操作の有効化
  - 通常の操作モードに設定
- **呼び出しタイミング**: 通常ターン開始時

#### `disableUserInteraction()`

- **目的**: ユーザー操作を無効化
- **処理内容**:
  - クリックイベントの無効化
  - 操作不可状態の視覚的表示
- **呼び出しタイミング**: ゲーム終了時、AI 思考中

#### `showSecondBestOption()`

- **目的**: Second Best 宣言オプションの表示
- **処理内容**:
  - Second Best 宣言ボタンの表示
  - 宣言可能状態の視覚的表示
- **呼び出しタイミング**: Second Best 宣言可能時

### エラーハンドリング関数

#### `showErrorMessage(message: string)`

- **目的**: エラーメッセージの表示
- **処理内容**:
  - エラーダイアログの表示
  - ユーザーへの適切なフィードバック
- **呼び出しタイミング**: API エラー発生時

#### `revertToLastValidState()`

- **目的**: 最後の有効な状態への復元
- **処理内容**:
  - 前回の有効なゲーム状態への復元
  - UI 状態のリセット
- **呼び出しタイミング**: エラー発生時

## エラーハンドリング

### API エラー処理

```typescript
try {
  await GameAPI.makeMove(action);
} catch (error) {
  // エラー表示
  showErrorMessage(error.message);

  // 状態のロールバック
  revertToLastValidState();
}
```

### 通信エラー処理

```typescript
// AI エラーイベントの処理
const handleAiError = (event: AiErrorEvent) => {
  showErrorDialog(`AI Error: ${event.message}`);
  // 必要に応じてゲーム状態のリセット
};
```

## パフォーマンス考慮事項

1. **描画最適化**

   - 状態変更時のみ再描画
   - 不要な描画処理のスキップ

2. **メモリ管理**

   - 画像リソースの適切な管理
   - イベントリスナーのクリーンアップ

3. **非同期処理**
   - API コールの適切な並行処理
   - ユーザー操作のレスポンシブ性確保
