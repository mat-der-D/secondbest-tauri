import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { 
  GameState, 
  MoveAction, 
  Player, 
  Position, 
  PieceStack,
  AiMoveEvent,
  AiSecondBestEvent,
  AiSecondMoveEvent,
  GameOverEvent,
  TurnPhaseEvent,
  AiErrorEvent
} from '../types/game';

// Pull型API（invoke関数）
export class GameAPI {
  // ゲーム管理
  static async newGame(): Promise<GameState> {
    return await invoke('new_game');
  }

  static async getGameState(): Promise<GameState> {
    return await invoke('get_game_state');
  }

  static async getLegalMoves(): Promise<MoveAction[]> {
    return await invoke('get_legal_moves');
  }

  // プレイヤーアクション
  static async makeMove(action: MoveAction): Promise<GameState> {
    return await invoke('make_move', { action });
  }

  static async declareSecondBest(): Promise<GameState> {
    return await invoke('declare_second_best');
  }

  // ゲーム情報
  static async checkWinner(): Promise<Player | null> {
    return await invoke('check_winner');
  }

  static async getPositionStack(position: Position): Promise<PieceStack> {
    return await invoke('get_position_stack', { position });
  }

  static async canDeclareSecondBest(): Promise<boolean> {
    return await invoke('can_declare_second_best');
  }
}

// Push型API（イベントリスナー）
export class GameEventListeners {
  // AI動作完了イベント
  static async onAiMoveCompleted(callback: (event: AiMoveEvent) => void) {
    return await listen<AiMoveEvent>('ai_move_completed', (event) => {
      callback(event.payload);
    });
  }

  // AI Second Best宣言イベント
  static async onAiSecondBestDeclared(callback: (event: AiSecondBestEvent) => void) {
    return await listen<AiSecondBestEvent>('ai_second_best_declared', (event) => {
      callback(event.payload);
    });
  }

  // AI代替手完了イベント
  static async onAiSecondMoveCompleted(callback: (event: AiSecondMoveEvent) => void) {
    return await listen<AiSecondMoveEvent>('ai_second_move_completed', (event) => {
      callback(event.payload);
    });
  }

  // ゲーム終了イベント
  static async onGameOver(callback: (event: GameOverEvent) => void) {
    return await listen<GameOverEvent>('game_over', (event) => {
      callback(event.payload);
    });
  }

  // ターンフェーズ変更イベント
  static async onTurnPhaseChanged(callback: (event: TurnPhaseEvent) => void) {
    return await listen<TurnPhaseEvent>('turn_phase_changed', (event) => {
      callback(event.payload);
    });
  }

  // AIエラーイベント
  static async onAiError(callback: (event: AiErrorEvent) => void) {
    return await listen<AiErrorEvent>('ai_error', (event) => {
      callback(event.payload);
    });
  }
}

// 使用例
export const gameApiExample = {
  async startNewGame() {
    try {
      const gameState = await GameAPI.newGame();
      console.log('新しいゲームが開始されました:', gameState);
      return gameState;
    } catch (error) {
      console.error('ゲーム開始エラー:', error);
      throw error;
    }
  },

  async makePlayerMove(action: MoveAction) {
    try {
      const gameState = await GameAPI.makeMove(action);
      console.log('プレイヤーの手が実行されました:', gameState);
      return gameState;
    } catch (error) {
      console.error('手の実行エラー:', error);
      throw error;
    }
  },

  setupEventListeners() {
    // AIの手完了イベントを監視
    GameEventListeners.onAiMoveCompleted((event) => {
      console.log('AIが手を完了しました:', event);
      // UIを更新するロジックをここに実装
    });

    // AI Second Best宣言イベントを監視
    GameEventListeners.onAiSecondBestDeclared((event) => {
      console.log('AIがSecond Best宣言をしました:', event);
      // プレイヤーに代替手選択を促すUIを表示
    });

    // ゲーム終了イベントを監視
    GameEventListeners.onGameOver((event) => {
      console.log('ゲームが終了しました:', event);
      // ゲーム終了UIを表示
    });
  }
}; 