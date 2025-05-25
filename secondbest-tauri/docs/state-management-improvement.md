# 状態管理の改善ガイド

## 📋 現在の状態管理の問題点

### 1. **単純すぎるページ遷移管理**

現在のプロジェクトでは、`App.tsx`で`useState`を使用した基本的なページ遷移のみが実装されています。

```typescript
// 現在の実装
const [currentPage, setCurrentPage] = useState<Page>("home");
```

**問題点:**

- URL とページ状態が同期していない
- ブラウザの戻る/進むボタンが機能しない
- ページ間でのデータ共有が困難
- 複雑な状態管理に対応できない

### 2. **グローバル状態の不在**

- ゲーム状態、ユーザー設定、スコアなどの共有データを管理する仕組みがない
- コンポーネント間でのデータ受け渡しが props のみに依存
- 状態の永続化機能がない

## 🎯 改善アプローチ

### アプローチ 1: React Router + Context API

#### **React Router の導入**

**メリット:**

- URL ベースのナビゲーション
- ブラウザ履歴との統合
- ネストされたルートのサポート
- コード分割との相性が良い

**実装すべき機能:**

- `/` - ホームページ
- `/game` - ゲームページ
- `/settings` - 設定ページ
- 404 エラーページ
- プログラマティックナビゲーション

**導入手順:**

1. `react-router-dom`のインストール
2. `BrowserRouter`でアプリをラップ
3. `Routes`と`Route`コンポーネントの設定
4. `useNavigate`フックでナビゲーション実装

#### **Context API によるグローバル状態管理**

**管理すべき状態:**

- **ゲーム状態**: 現在のゲーム進行状況、スコア、レベル
- **ユーザー設定**: 音量、言語、テーマ設定
- **UI 状態**: モーダルの表示状態、ローディング状態

**Context 設計例:**

```typescript
// GameContext - ゲーム関連の状態
interface GameState {
  score: number;
  level: number;
  isPlaying: boolean;
  gameHistory: GameRecord[];
}

// SettingsContext - 設定関連の状態
interface SettingsState {
  volume: number;
  language: "ja" | "en";
  theme: "light" | "dark";
}

// UIContext - UI関連の状態
interface UIState {
  isLoading: boolean;
  notifications: Notification[];
  modals: ModalState;
}
```

**実装パターン:**

- Reducer + Context パターンの採用
- カスタムフックでの Context 使用
- 状態の分離と組み合わせ

### アプローチ 2: Zustand による状態管理

#### **Zustand の特徴**

- **軽量**: 小さなバンドルサイズ
- **シンプル**: ボイラープレートが少ない
- **TypeScript 対応**: 優れた型安全性
- **DevTools 対応**: Redux DevTools との統合

#### **ストア設計**

**ゲームストア:**

```typescript
interface GameStore {
  // 状態
  score: number;
  level: number;
  isPlaying: boolean;
  gameBoard: GameBoard;

  // アクション
  startGame: () => void;
  endGame: () => void;
  updateScore: (points: number) => void;
  resetGame: () => void;
}
```

**設定ストア:**

```typescript
interface SettingsStore {
  // 状態
  volume: number;
  language: Language;
  theme: Theme;

  // アクション
  setVolume: (volume: number) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}
```

#### **永続化の実装**

- `zustand/middleware`の`persist`を使用
- LocalStorage または Tauri のファイルシステム API
- 設定データの自動保存・復元

### アプローチ 3: Redux Toolkit (大規模な場合)

#### **適用ケース**

- 複雑なゲームロジック
- 多数の非同期処理
- 時間旅行デバッグが必要
- チーム開発での標準化

#### **スライス設計**

```typescript
// gameSlice
interface GameState {
  currentGame: Game | null;
  gameHistory: Game[];
  statistics: GameStatistics;
  loading: boolean;
  error: string | null;
}

// settingsSlice
interface SettingsState {
  userPreferences: UserPreferences;
  gameSettings: GameSettings;
  uiSettings: UISettings;
}
```

## 🔄 状態の流れと責任分離

### **状態の分類**

#### **1. ローカル状態 (useState)**

- コンポーネント固有の一時的な状態
- フォームの入力値
- アニメーションの状態
- UI 要素の表示/非表示

#### **2. 共有状態 (Context/Zustand)**

- 複数コンポーネントで使用される状態
- ゲームの進行状況
- ユーザー設定
- 認証状態

#### **3. サーバー状態 (React Query/SWR)**

- サーバーから取得するデータ
- ランキング情報
- ユーザープロフィール
- ゲーム統計

### **データフローの設計**

```
User Action → Component → Store Action → State Update → UI Re-render
     ↓
Tauri Command → Rust Backend → File System / Database
```

## 🛠️ 実装戦略

### **段階的な移行計画**

#### **フェーズ 1: 基盤整備**

1. React Router の導入
2. 基本的な Context API の実装
3. 型定義の整備

#### **フェーズ 2: 状態管理の拡張**

1. ゲーム状態管理の実装
2. 設定管理の実装
3. 永続化機能の追加

#### **フェーズ 3: 最適化**

1. パフォーマンス最適化
2. エラーハンドリングの強化
3. テストの追加

### **技術選択の指針**

#### **小〜中規模プロジェクト**

- **推奨**: React Router + Zustand
- **理由**: シンプルで学習コストが低い

#### **大規模プロジェクト**

- **推奨**: React Router + Redux Toolkit
- **理由**: 標準化されたパターン、豊富なエコシステム

#### **プロトタイプ段階**

- **推奨**: React Router + Context API
- **理由**: 追加依存関係なし、素早い実装

## 📊 パフォーマンス考慮事項

### **Context API の最適化**

- 状態の分割による re-render の最小化
- `useMemo`と`useCallback`の適切な使用
- Context Provider の配置最適化

### **Zustand の最適化**

- セレクターの使用による部分的な状態購読
- 状態の正規化
- 非同期処理の適切な管理

### **メモリ管理**

- 不要な状態のクリーンアップ
- イベントリスナーの適切な削除
- 大きなオブジェクトの参照管理

## 🧪 テスト戦略

### **状態管理のテスト**

- **Context API**: カスタムフックのテスト
- **Zustand**: ストアの単体テスト
- **統合テスト**: コンポーネントと状態の連携テスト

### **テストツール**

- Jest + React Testing Library
- MSW (Mock Service Worker)
- Zustand/testing utilities

## 🔗 Tauri 連携

### **状態の永続化**

```typescript
// Tauriコマンドとの連携例
const saveGameState = async (gameState: GameState) => {
  await invoke("save_game_state", { state: gameState });
};

const loadGameState = async (): Promise<GameState> => {
  return await invoke("load_game_state");
};
```

### **リアルタイム同期**

- Tauri イベントシステムの活用
- ファイルシステム監視
- 設定変更の即座反映

## 📚 学習リソース

### **React Router**

- [React Router 公式ドキュメント](https://reactrouter.com/)
- [React Router Tutorial](https://reactrouter.com/en/main/start/tutorial)

### **Zustand**

- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)

### **Context API**

- [React Context 公式ドキュメント](https://react.dev/reference/react/createContext)
- [Context API ベストプラクティス](https://react.dev/learn/passing-data-deeply-with-context)

---

_このガイドは現在のプロジェクト状況に基づいて作成されており、段階的な実装を推奨しています。_
