import { useState, useCallback } from 'react';
import { GameState, Player, TurnPhase, MoveAction, Position } from '../../../types/game';
import { GameAPI } from '../../../lib/gameApi';
import { Piece, positionToIndex, playerToColor } from '../constants';

export const useGameState = () => {
  // ゲーム状態
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.Black);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>(TurnPhase.WaitingForMove);
  const [userInteractionEnabled, setUserInteractionEnabled] = useState<boolean>(true);
  
  // 表示状態
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [highlightedCells, setHighlightedCells] = useState<number[]>([]);
  const [highlightedPieces, setHighlightedPieces] = useState<number[]>([]);
  const [liftedPieces, setLiftedPieces] = useState<number[]>([]);
  const [showSecondBest, setShowSecondBest] = useState<boolean>(false);
  
  // 操作状態
  const [selectedPiecePosition, setSelectedPiecePosition] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ハイライト管理関数
  const updateHighlightsFromLegalMoves = useCallback((legalMoves: MoveAction[]) => {
    const placeCells: number[] = [];
    const movePieces: number[] = [];
    
    legalMoves.forEach(move => {
      if ('Place' in move) {
        const posIndex = positionToIndex(move.Place.position);
        placeCells.push(posIndex);
      } else if ('Move' in move) {
        const fromIndex = positionToIndex(move.Move.from);
        movePieces.push(fromIndex);
      }
    });
    
    setHighlightedCells(placeCells);
    setHighlightedPieces(movePieces);
  }, []);

  const highlightMovementDestinations = useCallback(async (fromPosition: Position) => {
    try {
      const legalMoves = await GameAPI.getLegalMoves();
      const destinations: number[] = [];
      
      legalMoves.forEach(move => {
        if ('Move' in move && move.Move.from === fromPosition) {
          const toIndex = positionToIndex(move.Move.to);
          destinations.push(toIndex);
        }
      });
      
      setHighlightedCells(destinations);
    } catch (error) {
      console.error('移動先の取得に失敗しました:', error);
      showErrorMessage('移動先の取得に失敗しました');
    }
  }, []);

  const clearAllHighlights = useCallback(() => {
    setHighlightedCells([]);
    setHighlightedPieces([]);
    setLiftedPieces([]);
  }, []);

  // ゲーム状態管理関数
  const initializePlayerTurn = useCallback(async () => {
    try {
      const legalMoves = await GameAPI.getLegalMoves();
      updateHighlightsFromLegalMoves(legalMoves);
      setUserInteractionEnabled(true);
      setSelectedPiecePosition(null);
    } catch (error) {
      console.error('プレイヤーターンの初期化に失敗しました:', error);
      showErrorMessage('ゲーム状態の取得に失敗しました');
    }
  }, [updateHighlightsFromLegalMoves]);

  const updateBoardFromGameState = useCallback((newGameState: GameState) => {
    console.log('ゲーム状態を更新中:', newGameState);
    setGameState(newGameState);
    setCurrentPlayer(newGameState.current_player);
    setTurnPhase(newGameState.turn_phase);
    
    // GameStateからPiece配列を生成
    const newPieces: Piece[] = [];
    Object.entries(newGameState.board).forEach(([positionStr, pieceStack]) => {
      const position = positionStr as Position;
      const posIndex = positionToIndex(position);
      
      pieceStack.pieces.forEach((player, heightIndex) => {
        newPieces.push({
          posIndex,
          heightIndex,
          color: playerToColor(player)
        });
      });
    });
    
    console.log('新しいpieces配列:', newPieces);
    setPieces(newPieces);
  }, []);

  const promptForAlternativeMove = useCallback(() => {
    // 前回の手を取り消し、代替手選択のUI表示
    setSelectedPiecePosition(null);
    clearAllHighlights();
    setUserInteractionEnabled(true); // ユーザー操作を有効化
    // TODO: ユーザーガイダンスの表示
    console.log('代替手を選択してください');
  }, [clearAllHighlights]);

  const highlightAlternativeMoves = useCallback(async () => {
    try {
      const legalMoves = await GameAPI.getLegalMoves();
      // TODO: 前回選択した手以外の合法手をフィルタリング
      updateHighlightsFromLegalMoves(legalMoves);
      setUserInteractionEnabled(true); // ユーザー操作を有効化
    } catch (error) {
      console.error('代替手の取得に失敗しました:', error);
      showErrorMessage('代替手の取得に失敗しました');
    }
  }, [updateHighlightsFromLegalMoves]);

  // UI制御関数
  const enableNormalMoveUI = useCallback(() => {
    setUserInteractionEnabled(true);
    setTurnPhase(TurnPhase.WaitingForMove);
  }, []);

  const disableUserInteraction = useCallback(() => {
    setUserInteractionEnabled(false);
    clearAllHighlights();
  }, [clearAllHighlights]);

  const showSecondBestOption = useCallback(() => {
    // TODO: Second Best宣言ボタンの表示
    console.log('Second Best宣言が可能です');
  }, []);

  // エラーハンドリング関数
  const showErrorMessage = useCallback((message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  }, []);

  const revertToLastValidState = useCallback(async () => {
    try {
      const currentGameState = await GameAPI.getGameState();
      updateBoardFromGameState(currentGameState);
      clearAllHighlights();
    } catch (error) {
      console.error('状態の復元に失敗しました:', error);
    }
  }, [updateBoardFromGameState, clearAllHighlights]);

  // ゲーム初期化
  const initializeGame = useCallback(async () => {
    try {
      const initialGameState = await GameAPI.newGame();
      updateBoardFromGameState(initialGameState);
      initializePlayerTurn();
    } catch (error) {
      console.error('ゲームの初期化に失敗しました:', error);
      showErrorMessage('ゲームの初期化に失敗しました');
    }
  }, [updateBoardFromGameState, initializePlayerTurn]);

  return {
    // 状態
    gameState,
    currentPlayer,
    turnPhase,
    userInteractionEnabled,
    pieces,
    highlightedCells,
    highlightedPieces,
    liftedPieces,
    showSecondBest,
    selectedPiecePosition,
    errorMessage,
    
    // 状態更新関数
    setHighlightedCells,
    setHighlightedPieces,
    setLiftedPieces,
    setShowSecondBest,
    setSelectedPiecePosition,
    setUserInteractionEnabled,
    setTurnPhase,
    
    // ゲーム管理関数
    updateHighlightsFromLegalMoves,
    highlightMovementDestinations,
    clearAllHighlights,
    initializePlayerTurn,
    updateBoardFromGameState,
    promptForAlternativeMove,
    highlightAlternativeMoves,
    enableNormalMoveUI,
    disableUserInteraction,
    showSecondBestOption,
    showErrorMessage,
    revertToLastValidState,
    initializeGame,
  };
}; 