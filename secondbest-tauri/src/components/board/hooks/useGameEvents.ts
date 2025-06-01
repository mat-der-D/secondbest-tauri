import { useCallback, useEffect } from 'react';
import { GameEventListeners } from '../../../lib/gameApi';
import { 
  AiMoveEvent,
  AiSecondBestEvent,
  AiSecondMoveEvent,
  GameOverEvent,
  TurnPhaseEvent,
  AiErrorEvent,
  TurnPhase
} from '../../../types/game';

interface GameEventsDependencies {
  // コア状態更新関数
  updateBoardFromGameState: (gameState: any) => void;
  setIsSecondBestShown: (show: boolean) => void;
  setTurnPhase: (phase: TurnPhase) => void;
  setUserInteractionEnabled: (enabled: boolean) => void;
  showErrorMessage: (message: string) => void;
  
  // フロー制御関数
  initializePlayerTurn: () => void;
  clearAllHighlights: () => void;
  revertToLastValidState: () => void;
}

export const useGameEvents = (deps: GameEventsDependencies) => {
  const {
    updateBoardFromGameState,
    setIsSecondBestShown,
    setTurnPhase,
    setUserInteractionEnabled,
    showErrorMessage,
    initializePlayerTurn,
    clearAllHighlights,
    revertToLastValidState,
  } = deps;

  // ローカル関数: 代替手選択のプロンプト
  const promptForAlternativeMove = useCallback(() => {
    // 前回の手を取り消し、代替手選択のUI表示
    clearAllHighlights();
    setUserInteractionEnabled(true); // ユーザー操作を有効化
    // TODO: ユーザーガイダンスの表示
    console.log('代替手を選択してください');
  }, [clearAllHighlights, setUserInteractionEnabled]);

  // ローカル関数: 代替手のハイライト表示
  const highlightAlternativeMoves = useCallback(() => {
    // TODO: 前回選択した手以外の合法手をフィルタリング
    // 現在は通常のプレイヤーターン初期化と同じ処理
    initializePlayerTurn();
  }, [initializePlayerTurn]);

  // ローカル関数: 通常移動UIの有効化
  const enableNormalMoveUI = useCallback(() => {
    setUserInteractionEnabled(true);
    setTurnPhase(TurnPhase.WaitingForMove);
  }, [setUserInteractionEnabled, setTurnPhase]);

  // ローカル関数: ユーザー操作の無効化
  const disableUserInteraction = useCallback(() => {
    setUserInteractionEnabled(false);
    clearAllHighlights();
  }, [setUserInteractionEnabled, clearAllHighlights]);

  // ローカル関数: Second Best宣言オプションの表示
  const showSecondBestOption = useCallback(() => {
    // TODO: Second Best宣言ボタンの表示
    console.log('Second Best宣言が可能です');
  }, []);
  
  // イベントハンドラー
  const handleAiMove = useCallback((event: AiMoveEvent) => {
    updateBoardFromGameState(event.new_state);
    initializePlayerTurn();
  }, [updateBoardFromGameState, initializePlayerTurn]);

  const handleAiSecondBest = useCallback((event: AiSecondBestEvent) => {
    console.log('AI Second Best宣言を受信:', event);
    setIsSecondBestShown(true);
    setTimeout(() => setIsSecondBestShown(false), 2000);
    
    updateBoardFromGameState(event.new_state);
    promptForAlternativeMove();
    highlightAlternativeMoves();
    
    // ユーザー操作を有効化
    setUserInteractionEnabled(true);
  }, [updateBoardFromGameState, promptForAlternativeMove, highlightAlternativeMoves, setIsSecondBestShown, setUserInteractionEnabled]);

  const handleAiSecondMove = useCallback((event: AiSecondMoveEvent) => {
    updateBoardFromGameState(event.new_state);
    setTurnPhase(TurnPhase.WaitingForMove);
    initializePlayerTurn();
  }, [updateBoardFromGameState, initializePlayerTurn, setTurnPhase]);

  const handleGameOver = useCallback((event: GameOverEvent) => {
    console.log('ゲーム終了:', event);
    disableUserInteraction();
    // TODO: ゲーム終了UIの表示
  }, [disableUserInteraction]);

  const handleTurnPhaseChange = useCallback((event: TurnPhaseEvent) => {
    setTurnPhase(event.new_phase);
    
    switch (event.new_phase) {
      case TurnPhase.WaitingForMove:
        enableNormalMoveUI();
        initializePlayerTurn();
        break;
      case TurnPhase.WaitingForSecondBest:
        showSecondBestOption();
        break;
      case TurnPhase.WaitingForSecondMove:
        promptForAlternativeMove();
        highlightAlternativeMoves();
        break;
    }
  }, [enableNormalMoveUI, initializePlayerTurn, showSecondBestOption, promptForAlternativeMove, highlightAlternativeMoves, setTurnPhase]);

  const handleAiError = useCallback((event: AiErrorEvent) => {
    showErrorMessage(`AI エラー: ${event.message}`);
    revertToLastValidState();
  }, [showErrorMessage, revertToLastValidState]);

  // イベントリスナーの設定
  useEffect(() => {
    const setupListeners = async () => {
      try {
        await GameEventListeners.onAiMoveCompleted(handleAiMove);
        await GameEventListeners.onAiSecondBestDeclared(handleAiSecondBest);
        await GameEventListeners.onAiSecondMoveCompleted(handleAiSecondMove);
        await GameEventListeners.onGameOver(handleGameOver);
        await GameEventListeners.onTurnPhaseChanged(handleTurnPhaseChange);
        await GameEventListeners.onAiError(handleAiError);
      } catch (error) {
        console.error('イベントリスナーの設定に失敗しました:', error);
      }
    };

    setupListeners();
  }, [handleAiMove, handleAiSecondBest, handleAiSecondMove, handleGameOver, handleTurnPhaseChange, handleAiError]);

  return {
    handleAiMove,
    handleAiSecondBest,
    handleAiSecondMove,
    handleGameOver,
    handleTurnPhaseChange,
    handleAiError,
  };
}; 