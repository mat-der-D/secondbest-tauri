import React, { useRef, useEffect, useState, useCallback } from 'react';
import './Board.css';
import { GameAPI, GameEventListeners } from '../lib/gameApi';
import { 
  GameState, 
  MoveAction, 
  Player, 
  Position, 
  TurnPhase,
  AiMoveEvent,
  AiSecondBestEvent,
  AiSecondMoveEvent,
  GameOverEvent,
  TurnPhaseEvent,
  AiErrorEvent
} from '../types/game';

// 定数定義
const BOARD_CONSTANTS = {
  CANVAS_WIDTH: 350,
  CANVAS_HEIGHT: 350,
  PIECE_WIDTH: 50,
  CELL_WIDTH: 70,
  PIECE_LIFT_OFFSET_RATIO: 0.2,
} as const;

const IMAGE_PATHS = {
  pieceWhite: '/src/assets/piece_white.svg',
  pieceBlack: '/src/assets/piece_black.svg',
  board: '/src/assets/board.svg',
  pieceFrame: '/src/assets/piece_frame.svg',
  cellFrame: '/src/assets/cell_frame.svg',
  secondBest: '/src/assets/secondbest.svg',
} as const;

// 型定義
interface Piece {
  posIndex: number;
  heightIndex: number;
  color: 'B' | 'W';
}

interface Images {
  pieceWhite: HTMLImageElement | null;
  pieceBlack: HTMLImageElement | null;
  board: HTMLImageElement | null;
  pieceFrame: HTMLImageElement | null;
  cellFrame: HTMLImageElement | null;
  secondBest: HTMLImageElement | null;
}

// Position列挙型とposIndexの変換関数
const positionToIndex = (position: Position): number => {
  const positionMap: Record<Position, number> = {
    [Position.N]: 0, [Position.NE]: 1, [Position.E]: 2, [Position.SE]: 3,
    [Position.S]: 4, [Position.SW]: 5, [Position.W]: 6, [Position.NW]: 7
  };
  return positionMap[position];
};

const indexToPosition = (index: number): Position => {
  const indexMap: Position[] = [Position.N, Position.NE, Position.E, Position.SE, Position.S, Position.SW, Position.W, Position.NW];
  return indexMap[index];
};

// Player型とcolor文字の変換関数
const playerToColor = (player: Player): 'B' | 'W' => {
  return player === Player.Black ? 'B' : 'W';
};

const colorToPlayer = (color: 'B' | 'W'): Player => {
  return color === 'B' ? Player.Black : Player.White;
};

// ユーティリティ関数
const adjustSize = (originalWidth: number, originalHeight: number, targetWidth: number) => {
  const aspectRatio = originalHeight / originalWidth;
  return {
    width: targetWidth,
    height: targetWidth * aspectRatio,
  };
};

const calcPosCenter = (canvas: HTMLCanvasElement, posIndex: number) => {
  const radiusX = 0.358;
  const radiusY = radiusX * 0.8;
  const angle = (-3 * Math.PI / 8) + (Math.PI / 4) * posIndex;
  const [xBase, yBase] = [radiusX * Math.cos(angle), radiusY * Math.sin(angle)];
  
  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;
  
  return { 
    x: xBase * canvas.width + canvasCenterX, 
    y: yBase * canvas.width + canvasCenterY 
  };
};

const calcPieceCoordinate = (canvas: HTMLCanvasElement, pieceWidth: number, piece: Piece, liftOffset: number = 0) => {
  const dh0 = 0.12; // コマの底面の中心に補正する項
  const dh = 0.19; // コマの高さ

  const { x: xBase, y: yBase } = calcPosCenter(canvas, piece.posIndex);
  const liftYOffset = liftOffset * pieceWidth;
  return { 
    x: xBase, 
    y: yBase - (dh0 + dh * piece.heightIndex) * pieceWidth - liftYOffset 
  };
};

const calcPosRect = (canvas: HTMLCanvasElement, pieceWidth: number, posIndex: number) => {
  const rectWidth = pieceWidth;
  const rectTopHeight = pieceWidth * 0.97;
  const rectBottomHeight = pieceWidth * 0.42;
  const rectHeight = rectTopHeight + rectBottomHeight;
  const { x: xBase, y: yBase } = calcPosCenter(canvas, posIndex);

  return {
    x: xBase - rectWidth / 2,
    y: yBase - rectTopHeight,
    width: rectWidth,
    height: rectHeight,
  }
};

// 画像読み込み用のカスタムフック
const useImageLoader = () => {
  const [images, setImages] = useState<Images>({
    pieceWhite: null,
    pieceBlack: null,
    board: null,
    pieceFrame: null,
    cellFrame: null,
    secondBest: null,
  });

  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const loadAllImages = async () => {
      try {
        const [
          pieceWhite,
          pieceBlack,
          board,
          pieceFrame,
          cellFrame,
          secondBest
        ] = await Promise.all([
          loadImage(IMAGE_PATHS.pieceWhite),
          loadImage(IMAGE_PATHS.pieceBlack),
          loadImage(IMAGE_PATHS.board),
          loadImage(IMAGE_PATHS.pieceFrame),
          loadImage(IMAGE_PATHS.cellFrame),
          loadImage(IMAGE_PATHS.secondBest),
        ]);
        
        setImages({
          pieceWhite,
          pieceBlack,
          board,
          pieceFrame,
          cellFrame,
          secondBest,
        });
      } catch (error) {
        console.error('Failed to load images:', error);
      }
    };

    loadAllImages();
  }, []);

  return images;
};

// 描画関数群
const drawBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, boardImage: HTMLImageElement) => {
  const { width: drawWidth, height: drawHeight } = adjustSize(
    boardImage.width,
    boardImage.height,
    canvas.width
  );
  
  const offsetX = (canvas.width - drawWidth) / 2;
  const offsetY = (canvas.height - drawHeight) / 2;
  
  ctx.drawImage(boardImage, offsetX, offsetY, drawWidth, drawHeight);
};

const drawHighlightedCells = (
  ctx: CanvasRenderingContext2D, 
  canvas: HTMLCanvasElement, 
  highlightedCells: number[], 
  cellFrameImage: HTMLImageElement,
  cellWidth: number
) => {
  highlightedCells.forEach(posIndex => {
    const { x, y } = calcPosCenter(canvas, posIndex);
    const { width: drawCellWidth, height: drawCellHeight } = adjustSize(
      cellFrameImage.width,
      cellFrameImage.height,
      cellWidth
    );
    
    ctx.drawImage(
      cellFrameImage,
      x - drawCellWidth / 2,
      y - drawCellHeight / 2,
      drawCellWidth,
      drawCellHeight
    );
  });
};

const drawPieces = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  pieces: Piece[],
  images: Images,
  liftedPieces: number[],
  pieceWidth: number,
  pieceLifeOffsetRatio: number
) => {
  const posMaxHeightMap = new Map<number, number>();
  
  // 各位置における最大のheightIndexを計算
  pieces.forEach(piece => {
    const currentMax = posMaxHeightMap.get(piece.posIndex) || -1;
    if (piece.heightIndex > currentMax) {
      posMaxHeightMap.set(piece.posIndex, piece.heightIndex);
    }
  });

  // 配置された駒を描画
  pieces.forEach(piece => {
    const isTopPiece = piece.heightIndex === posMaxHeightMap.get(piece.posIndex);
    const liftOffset = isTopPiece && liftedPieces.includes(piece.posIndex) ? pieceLifeOffsetRatio : 0;
    
    const { x, y } = calcPieceCoordinate(canvas, pieceWidth, piece, liftOffset);
    const pieceImage = piece.color === 'W' ? images.pieceWhite : images.pieceBlack;
    
    if (pieceImage) {
      const { width: drawPieceWidth, height: drawPieceHeight } = adjustSize(
        pieceImage.width,
        pieceImage.height,
        pieceWidth
      );
      
      ctx.drawImage(
        pieceImage,
        x - drawPieceWidth / 2,
        y - drawPieceHeight / 2,
        drawPieceWidth,
        drawPieceHeight
      );
    }
  });

  return posMaxHeightMap;
};

const drawPieceFrames = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  highlightedPieces: number[],
  posMaxHeightMap: Map<number, number>,
  liftedPieces: number[],
  pieceFrameImage: HTMLImageElement,
  pieceWidth: number,
  pieceLifeOffsetRatio: number
) => {
  highlightedPieces.forEach(posIndex => {
    const maxHeight = posMaxHeightMap.get(posIndex);
    if (maxHeight !== undefined) {
      const topPiece: Piece = { posIndex, heightIndex: maxHeight, color: 'W' };
      const liftOffset = liftedPieces.includes(posIndex) ? pieceLifeOffsetRatio : 0;
      const { x, y } = calcPieceCoordinate(canvas, pieceWidth, topPiece, liftOffset);
      
      const { width: drawFrameWidth, height: drawFrameHeight } = adjustSize(
        pieceFrameImage.width,
        pieceFrameImage.height,
        pieceWidth
      );
      
      ctx.drawImage(
        pieceFrameImage,
        x - drawFrameWidth / 2,
        y - drawFrameHeight / 2,
        drawFrameWidth,
        drawFrameHeight
      );
    }
  });
};

const drawSecondBest = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  secondBestImage: HTMLImageElement
) => {
  const { width: drawSecondBestWidth, height: drawSecondBestHeight } = adjustSize(
    secondBestImage.width,
    secondBestImage.height,
    canvas.width
  );
  
  const secondBestOffsetX = (canvas.width - drawSecondBestWidth) / 2;
  const secondBestOffsetY = (canvas.height - drawSecondBestHeight) / 2;
  
  ctx.drawImage(
    secondBestImage,
    secondBestOffsetX,
    secondBestOffsetY,
    drawSecondBestWidth,
    drawSecondBestHeight
  );
};

// メインコンポーネント
const Board: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useImageLoader();
  
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
  }, [updateBoardFromGameState, promptForAlternativeMove, highlightAlternativeMoves]);

  const handleAiSecondMove = useCallback((event: AiSecondMoveEvent) => {
    updateBoardFromGameState(event.new_state);
    setTurnPhase(TurnPhase.WaitingForMove);
    initializePlayerTurn();
  }, [updateBoardFromGameState, initializePlayerTurn]);

  const handleGameOver = useCallback((event: GameOverEvent) => {
    console.log('ゲーム終了:', event);
    disableUserInteraction();
    // TODO: ゲーム終了UIの表示
  }, [disableUserInteraction]);

  const handleTurnPhaseChange = useCallback((event: TurnPhaseEvent) => {
    setTurnPhase(event.new_phase);
    setCurrentPlayer(event.current_player);
    
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
  }, [enableNormalMoveUI, initializePlayerTurn, showSecondBestOption, promptForAlternativeMove, highlightAlternativeMoves]);

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

  // ゲーム初期化
  useEffect(() => {
    const initializeGame = async () => {
      try {
        const initialGameState = await GameAPI.newGame();
        updateBoardFromGameState(initialGameState);
        initializePlayerTurn();
      } catch (error) {
        console.error('ゲームの初期化に失敗しました:', error);
        showErrorMessage('ゲームの初期化に失敗しました');
      }
    };

    initializeGame();
  }, [updateBoardFromGameState, initializePlayerTurn, showErrorMessage]);

  // 描画処理を統合したuseEffect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !Object.values(images).every(img => img)) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 各描画処理を順次実行
    drawBackground(ctx, canvas, images.board!);
    drawHighlightedCells(ctx, canvas, highlightedCells, images.cellFrame!, BOARD_CONSTANTS.CELL_WIDTH);
    
    const posMaxHeightMap = drawPieces(
      ctx, canvas, pieces, images, liftedPieces, 
      BOARD_CONSTANTS.PIECE_WIDTH, BOARD_CONSTANTS.PIECE_LIFT_OFFSET_RATIO
    );
    
    drawPieceFrames(
      ctx, canvas, highlightedPieces, posMaxHeightMap, liftedPieces,
      images.pieceFrame!, BOARD_CONSTANTS.PIECE_WIDTH, BOARD_CONSTANTS.PIECE_LIFT_OFFSET_RATIO
    );
    
    if (showSecondBest) {
      drawSecondBest(ctx, canvas, images.secondBest!);
    }
  }, [pieces, images, highlightedCells, highlightedPieces, liftedPieces, showSecondBest]);

  const handleCanvasClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!userInteractionEnabled || !gameState) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    // キャンバス上のクリック座標を取得
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // どのposIndexの領域内がクリックされたかを判定
    const clickedPosIndex = Array.from({ length: 8 }).findIndex((_, posIndex) => {
      const { x, y, width, height } = calcPosRect(canvas, BOARD_CONSTANTS.PIECE_WIDTH, posIndex);
      return clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height;
    });

    // クリックされた位置が領域内にない場合は何もしない
    if (clickedPosIndex === -1) return;
    
    const clickedPosition = indexToPosition(clickedPosIndex);

    try {
      // 移動元が選択されている場合
      if (selectedPiecePosition !== null) {
        const fromPosition = indexToPosition(selectedPiecePosition);
        
        // 移動先として有効かチェック
        if (highlightedCells.includes(clickedPosIndex)) {
          const moveAction: MoveAction = {
            Move: { from: fromPosition, to: clickedPosition }
          };
          
          console.log('移動アクションを実行:', moveAction);
          const newGameState = await GameAPI.makeMove(moveAction);
          console.log('移動後の新しいゲーム状態:', newGameState);
          
          // 即座にボード状態を更新
          updateBoardFromGameState(newGameState);
          clearAllHighlights();
          setSelectedPiecePosition(null);
          setUserInteractionEnabled(false); // AI の手番まで無効化
        } else {
          // 無効な移動先の場合、選択をクリア
          setSelectedPiecePosition(null);
          clearAllHighlights();
          initializePlayerTurn();
        }
      } else {
        // 配置可能なマスがクリックされた場合
        if (highlightedCells.includes(clickedPosIndex)) {
          const placeAction: MoveAction = {
            Place: { position: clickedPosition, player: currentPlayer }
          };
          
          console.log('配置アクションを実行:', placeAction);
          const newGameState = await GameAPI.makeMove(placeAction);
          console.log('配置後の新しいゲーム状態:', newGameState);
          
          // 即座にボード状態を更新
          updateBoardFromGameState(newGameState);
          clearAllHighlights();
          setUserInteractionEnabled(false); // AI の手番まで無効化
        }
        // 移動可能なコマがクリックされた場合
        else if (highlightedPieces.includes(clickedPosIndex)) {
          setSelectedPiecePosition(clickedPosIndex);
          setLiftedPieces([clickedPosIndex]);
          setHighlightedPieces([]); // コマのハイライトをクリア
          await highlightMovementDestinations(clickedPosition);
        }
      }
    } catch (error) {
      console.error('手の実行に失敗しました:', error);
      showErrorMessage('手の実行に失敗しました');
      revertToLastValidState();
    }
  };

  return (
    <div className="board-container">
      <canvas 
        ref={canvasRef}
        className="board-canvas"
        width={BOARD_CONSTANTS.CANVAS_WIDTH}
        height={BOARD_CONSTANTS.CANVAS_HEIGHT}
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default Board; 