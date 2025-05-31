# Board Hooks アーキテクチャドキュメント

## 概要

`src/components/board/hooks`ディレクトリには、ボードゲームの状態管理とユーザーインタラクションを担当する 9 つのカスタム hook が含まれています。これらの hook は単一責任の原則に基づいて設計され、明確な役割分担と依存関係を持っています。

## Hook 一覧（コンパクト版）

- **useBoardController**: 全体統合管理
- **useGameCore**: ゲーム基本状態
- **useUIState**: UI 表示制御
- **useUserInteraction**: ユーザー操作制御
- **useErrorHandling**: エラー処理
- **useGameFlow**: ゲームフロー制御
- **useGameEvents**: イベント処理
- **useCanvasInteraction**: キャンバス操作
- **useImageLoader**: 画像読み込み

## Hook 一覧と役割

### 1. useBoardController

**役割**: 全体的な状態とロジックの統合管理

**説明**:

- 各専門領域の hook を組み合わせて統一されたインターフェースを提供
- Board.tsx で必要な値のみを公開する最上位の hook

**引数**: なし

**戻り値**:

```typescript
{
  // 描画に必要な状態
  pieces: Piece[];
  highlightedCells: number[];
  highlightedPieces: number[];
  liftedPieces: number[];
  showSecondBest: boolean;
  errorMessage: string;

  // 操作に必要な関数
  initializeGame: () => Promise<void>;
  handleCanvasClick: (event: React.MouseEvent<HTMLCanvasElement>) => Promise<void>;
}
```

### 2. useGameCore

**役割**: ゲームの基本状態管理

**説明**:

- ゲーム状態、現在のプレイヤー、ターンフェーズ、駒配置を管理
- GameAPI との連携によるゲーム状態の更新

**引数**: なし

**戻り値**:

```typescript
{
  // 状態
  gameState: GameState | null;
  currentPlayer: Player;
  turnPhase: TurnPhase;
  pieces: Piece[];

  // 状態更新関数
  setTurnPhase: (phase: TurnPhase) => void;
  updateBoardFromGameState: (gameState: GameState) => void;
  revertToLastValidState: () => Promise<void>;
  initializeGame: () => Promise<void>;
}
```

### 3. useUIState

**役割**: UI 表示状態の管理

**説明**:

- ハイライト表示、エフェクト、視覚的フィードバックを管理
- 合法手の表示とユーザーの選択状態の視覚化

**引数**: なし

**戻り値**:

```typescript
{
  // 状態
  highlightedCells: number[];
  highlightedPieces: number[];
  liftedPieces: number[];
  showSecondBest: boolean;

  // 状態更新関数
  setHighlightedCells: (cells: number[]) => void;
  setHighlightedPieces: (pieces: number[]) => void;
  setLiftedPieces: (pieces: number[]) => void;
  setShowSecondBest: (show: boolean) => void;

  // ハイライト管理関数
  updateHighlightsFromLegalMoves: (legalMoves: MoveAction[]) => void;
  highlightMovementDestinations: (fromPosition: Position, onError: (message: string) => void) => Promise<void>;
  clearAllHighlights: () => void;
}
```

### 4. useUserInteraction

**役割**: ユーザー操作状態の管理

**説明**:

- ユーザーの操作制御とインタラクション状態を管理
- 選択状態と UI 制御機能を提供

**引数**: なし

**戻り値**:

```typescript
{
  // 状態
  userInteractionEnabled: boolean;
  selectedPiecePosition: number | null;

  // 状態更新関数
  setUserInteractionEnabled: (enabled: boolean) => void;
  setSelectedPiecePosition: (position: number | null) => void;

  // UI制御関数
  enableNormalMoveUI: (setTurnPhase: (phase: TurnPhase) => void) => void;
  disableUserInteraction: (clearAllHighlights: () => void) => void;
  showSecondBestOption: () => void;
  promptForAlternativeMove: (clearAllHighlights: () => void) => void;
}
```

### 5. useErrorHandling

**役割**: エラー処理とメッセージ管理

**説明**:

- エラーメッセージの表示と自動クリア機能
- 3 秒後の自動消去機能付き

**引数**: なし

**戻り値**:

```typescript
{
  // 状態
  errorMessage: string;

  // エラー処理関数
  showErrorMessage: (message: string) => void;
  clearErrorMessage: () => void;
}
```

### 6. useGameFlow

**役割**: ゲームフロー制御

**説明**:

- ターン管理、初期化、フロー制御を担当
- 他の hook に依存する高次の制御ロジック

**引数**:

```typescript
{
  updateHighlightsFromLegalMoves: (legalMoves: MoveAction[]) => void;
  setUserInteractionEnabled: (enabled: boolean) => void;
  setSelectedPiecePosition: (position: number | null) => void;
  showErrorMessage: (message: string) => void;
  initializeGame: () => Promise<void>;
}
```

**戻り値**:

```typescript
{
  initializePlayerTurn: () => Promise<void>;
  highlightAlternativeMoves: () => Promise<void>;
  initializeGameWithErrorHandling: () => Promise<void>;
}
```

### 7. useGameEvents

**役割**: ゲームイベントの処理

**説明**:

- AI の手、Second Best 宣言、ゲーム終了などのイベントを処理
- GameEventListeners との連携によるリアルタイムイベント処理

**引数**:

```typescript
{
  // コア状態更新関数
  updateBoardFromGameState: (gameState: any) => void;
  setShowSecondBest: (show: boolean) => void;
  setTurnPhase: (phase: TurnPhase) => void;
  setUserInteractionEnabled: (enabled: boolean) => void;
  showErrorMessage: (message: string) => void;

  // フロー制御関数
  initializePlayerTurn: () => void;
  clearAllHighlights: () => void;
  revertToLastValidState: () => void;
}
```

**戻り値**:

```typescript
{
  handleAiMove: (event: AiMoveEvent) => void;
  handleAiSecondBest: (event: AiSecondBestEvent) => void;
  handleAiSecondMove: (event: AiSecondMoveEvent) => void;
  handleGameOver: (event: GameOverEvent) => void;
  handleTurnPhaseChange: (event: TurnPhaseEvent) => void;
  handleAiError: (event: AiErrorEvent) => void;
}
```

### 8. useCanvasInteraction

**役割**: キャンバス操作の処理

**説明**:

- マウスクリックイベントの処理と手の実行
- 座標計算、アクション実行、状態更新を統合

**引数**:

```typescript
{
  // 読み取り専用状態
  userInteractionEnabled: boolean;
  gameState: any;
  selectedPiecePosition: number | null;
  highlightedCells: number[];
  highlightedPieces: number[];
  currentPlayer: any;

  // 状態更新関数
  updateBoardFromGameState: (gameState: any) => void;
  showErrorMessage: (message: string) => void;
  setSelectedPiecePosition: (position: number | null) => void;
  setLiftedPieces: (pieces: number[]) => void;
  setHighlightedPieces: (pieces: number[]) => void;
  setUserInteractionEnabled: (enabled: boolean) => void;
  clearAllHighlights: () => void;

  // 非同期操作
  highlightMovementDestinations: (position: any) => Promise<void>;
}
```

**戻り値**:

```typescript
{
  handleCanvasClick: (event: React.MouseEvent<HTMLCanvasElement>) =>
    Promise<void>;
}
```

### 9. useImageLoader

**役割**: 画像リソースの非同期読み込み

**説明**:

- ゲームで使用する画像の並行読み込み
- 読み込み完了まで適切な状態管理

**引数**: なし

**戻り値**:

```typescript
{
  pieceWhite: HTMLImageElement | null;
  pieceBlack: HTMLImageElement | null;
  board: HTMLImageElement | null;
  pieceFrame: HTMLImageElement | null;
  cellFrame: HTMLImageElement | null;
  secondBest: HTMLImageElement | null;
}
```

## Hook 間の依存関係

### 依存関係図

```
useBoardController (統合管理)
├── useGameCore (基本状態) ← 独立
├── useUIState (UI状態) ← 独立
├── useUserInteraction (操作状態) ← 独立
├── useErrorHandling (エラー処理) ← 独立
├── useGameFlow (フロー制御)
│   ├── ← useUIState.updateHighlightsFromLegalMoves
│   ├── ← useUserInteraction.setUserInteractionEnabled
│   ├── ← useUserInteraction.setSelectedPiecePosition
│   ├── ← useErrorHandling.showErrorMessage
│   └── ← useGameCore.initializeGame
├── useGameEvents (イベント処理)
│   ├── ← useGameCore.updateBoardFromGameState
│   ├── ← useUIState.setShowSecondBest
│   ├── ← useGameCore.setTurnPhase
│   ├── ← useUserInteraction.setUserInteractionEnabled
│   ├── ← useErrorHandling.showErrorMessage
│   ├── ← useGameFlow.initializePlayerTurn
│   ├── ← useUIState.clearAllHighlights
│   └── ← revertToLastValidState (統合関数)
└── useCanvasInteraction (キャンバス操作)
    ├── ← useUserInteraction.userInteractionEnabled
    ├── ← useGameCore.gameState
    ├── ← useUserInteraction.selectedPiecePosition
    ├── ← useUIState.highlightedCells
    ├── ← useUIState.highlightedPieces
    ├── ← useGameCore.currentPlayer
    ├── ← useGameCore.updateBoardFromGameState
    ├── ← useErrorHandling.showErrorMessage
    ├── ← useUserInteraction.setSelectedPiecePosition
    ├── ← useUIState.setLiftedPieces
    ├── ← useUIState.setHighlightedPieces
    ├── ← useUserInteraction.setUserInteractionEnabled
    ├── ← useUIState.clearAllHighlights
    └── ← highlightMovementDestinations (統合関数)

useImageLoader (独立) ← 他のhookに依存しない
```

### 階層別の依存関係

```
レイヤー1 (基盤層): 独立したhook
├── useGameCore
├── useUIState
├── useUserInteraction
├── useErrorHandling
└── useImageLoader

レイヤー2 (制御層): 基盤層に依存
├── useGameFlow
│   └── depends on: useGameCore, useUIState, useUserInteraction, useErrorHandling
├── useGameEvents
│   └── depends on: useGameCore, useUIState, useUserInteraction, useErrorHandling, useGameFlow
└── useCanvasInteraction
    └── depends on: useGameCore, useUIState, useUserInteraction, useErrorHandling

レイヤー3 (統合層): 全てを統合
└── useBoardController
    └── depends on: 全ての下位hook
```

### 依存関係の特徴

1. **階層構造**: useBoardController が最上位で、各専門 hook を統合
2. **単一責任**: 各 hook は明確に定義された単一の責任を持つ
3. **疎結合**: hook は直接的な依存ではなく、関数の注入により結合
4. **独立性**: useImageLoader は他の hook に依存しない独立した hook
5. **レイヤー化**: 基盤層 → 制御層 → 統合層の 3 層構造

## アーキテクチャの利点

### 1. 保守性

- 各 hook が単一の責任を持つため、変更の影響範囲が限定的
- 明確な依存関係により、変更時の影響を予測しやすい

### 2. テスト容易性

- 各 hook を独立してテスト可能
- 依存関係の注入により、モックを使用したテストが容易

### 3. 再利用性

- 専門化された hook は他のコンポーネントでも再利用可能
- 統合 hook と専門 hook の分離により、柔軟な組み合わせが可能

### 4. 可読性

- 各 hook の役割が明確で、コードの理解が容易
- 依存関係が明示的で、データフローが追跡しやすい

### 5. パフォーマンス

- 必要最小限の値のみを公開することで、不要な再レンダリングを防止
- 専門化により、関連する状態のみが更新される

## 使用例

```typescript
// Board.tsx での使用例
const Board: React.FC = () => {
  const images = useImageLoader();

  const {
    pieces,
    highlightedCells,
    highlightedPieces,
    liftedPieces,
    showSecondBest,
    errorMessage,
    initializeGame,
    handleCanvasClick,
  } = useBoardController();

  // ゲーム初期化
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // 描画処理...
};
```

このアーキテクチャにより、複雑なゲーム状態管理を効率的かつ保守しやすい形で実現しています。
