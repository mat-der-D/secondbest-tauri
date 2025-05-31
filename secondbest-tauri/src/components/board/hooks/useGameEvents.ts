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

interface UseGameEventsProps {
  updateBoardFromGameState: (gameState: any) => void;
  initializePlayerTurn: () => void;
  setShowSecondBest: (show: boolean) => void;
  promptForAlternativeMove: () => void;
  highlightAlternativeMoves: () => void;
  setUserInteractionEnabled: (enabled: boolean) => void;
  setTurnPhase: (phase: TurnPhase) => void;
  disableUserInteraction: () => void;
  enableNormalMoveUI: () => void;
  showSecondBestOption: () => void;
  showErrorMessage: (message: string) => void;
  revertToLastValidState: () => void;
}

export const useGameEvents = ({
  updateBoardFromGameState,
  initializePlayerTurn,
  setShowSecondBest,
  promptForAlternativeMove,
  highlightAlternativeMoves,
  setUserInteractionEnabled,
  setTurnPhase,
  disableUserInteraction,
  enableNormalMoveUI,
  showSecondBestOption,
  showErrorMessage,
  revertToLastValidState,
}: UseGameEventsProps) => {
  
  // イベントハンドラー
  const handleAiMove = useCallback((event: AiMoveEvent) => {
    updateBoardFromGameState(event.new_state);
    initializePlayerTurn();
  }, [updateBoardFromGameState, initializePlayerTurn]);

  const handleAiSecondBest = useCallback((event: AiSecondBestEvent) => {
    console.log('AI Second Best宣言を受信:', event);
    setShowSecondBest(true);
    setTimeout(() => setShowSecondBest(false), 2000);
    
    updateBoardFromGameState(event.new_state);
    promptForAlternativeMove();
    highlightAlternativeMoves();
    
    // ユーザー操作を有効化
    setUserInteractionEnabled(true);
  }, [updateBoardFromGameState, promptForAlternativeMove, highlightAlternativeMoves, setShowSecondBest, setUserInteractionEnabled]);

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