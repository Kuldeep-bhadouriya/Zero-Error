"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// Tetris pieces - themed for Zero Error Esports
const TETRIS_PIECES = [
  { shape: [[1, 1, 1, 1]], color: 'bg-red-600' },
  { shape: [[1, 1], [1, 1]], color: 'bg-red-600' },
  { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-red-600' },
  { shape: [[1, 0], [1, 0], [1, 1]], color: 'bg-red-600' },
  { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-red-600' },
  { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-600' },
  { shape: [[0, 1], [0, 1], [1, 1]], color: 'bg-red-600' },
];

interface Cell {
  filled: boolean;
  color: string;
}

interface FallingPiece {
  shape: number[][];
  color: string;
  x: number;
  y: number;
  id: string;
}

interface TetrisAnimationProps {
  gridWidth?: number;
  gridHeight?: number;
  cellSize?: string;
  fallSpeed?: number;
}

const TetrisAnimation: React.FC<TetrisAnimationProps> = ({
  gridWidth = 10,
  gridHeight = 12,
  cellSize = 'w-3 h-3',
  fallSpeed = 60,
}) => {
  const [grid, setGrid] = useState<Cell[][]>(() =>
    Array(gridHeight).fill(null).map(() => 
      Array(gridWidth).fill(null).map(() => ({ filled: false, color: '' }))
    )
  );
  const [fallingPiece, setFallingPiece] = useState<FallingPiece | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const frameRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);

  const rotateShape = useCallback((shape: number[][]): number[][] => {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated: number[][] = Array(cols).fill(null).map(() => Array(rows).fill(0));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = shape[i][j];
      }
    }
    return rotated;
  }, []);

  const createNewPiece = useCallback((): FallingPiece => {
    const pieceData = TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)];
    let shape = pieceData.shape;
    const rotations = Math.floor(Math.random() * 4);
    for (let i = 0; i < rotations; i++) {
      shape = rotateShape(shape);
    }
    const maxX = gridWidth - shape[0].length;
    const x = Math.floor(Math.random() * (maxX + 1));
    return { shape, color: pieceData.color, x, y: -shape.length, id: Math.random().toString(36).substr(2, 9) };
  }, [rotateShape, gridWidth]);

  const canPlacePiece = useCallback((piece: FallingPiece, newX: number, newY: number): boolean => {
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const gridX = newX + col;
          const gridY = newY + row;
          if (gridX < 0 || gridX >= gridWidth || gridY >= gridHeight) return false;
          if (gridY >= 0 && grid[gridY][gridX].filled) return false;
        }
      }
    }
    return true;
  }, [grid, gridWidth, gridHeight]);

  const placePiece = useCallback((piece: FallingPiece) => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
          if (piece.shape[row][col]) {
            const gridX = piece.x + col;
            const gridY = piece.y + row;
            if (gridY >= 0 && gridY < gridHeight && gridX >= 0 && gridX < gridWidth) {
              newGrid[gridY][gridX] = { filled: true, color: piece.color };
            }
          }
        }
      }
      return newGrid;
    });
  }, [gridWidth, gridHeight]);

  const clearFullLines = useCallback(() => {
    setGrid(prevGrid => {
      const linesToClear: number[] = [];
      prevGrid.forEach((row, index) => {
        if (row.every(cell => cell.filled)) linesToClear.push(index);
      });
      if (linesToClear.length > 0) {
        setIsClearing(true);
        const newGrid = prevGrid.map((row, rowIndex) => {
          if (linesToClear.includes(rowIndex)) {
            return row.map(cell => ({ ...cell, color: 'bg-red-400 animate-pulse' }));
          }
          return row;
        });
        setTimeout(() => {
          setGrid(currentGrid => {
            const filteredGrid = currentGrid.filter((_, index) => !linesToClear.includes(index));
            const emptyRows = Array(linesToClear.length).fill(null).map(() => 
              Array(gridWidth).fill(null).map(() => ({ filled: false, color: '' }))
            );
            setIsClearing(false);
            return [...emptyRows, ...filteredGrid];
          });
        }, 200);
        return newGrid;
      }
      return prevGrid;
    });
  }, [gridWidth]);

  const checkAndReset = useCallback(() => {
    const topRows = grid.slice(0, 3);
    const needsReset = topRows.some(row => row.filter(cell => cell.filled).length > gridWidth * 0.7);
    if (needsReset) {
      setIsClearing(true);
      setTimeout(() => {
        setGrid(Array(gridHeight).fill(null).map(() => 
          Array(gridWidth).fill(null).map(() => ({ filled: false, color: '' }))
        ));
        setFallingPiece(null);
        setIsClearing(false);
      }, 500);
      return true;
    }
    return false;
  }, [grid, gridWidth, gridHeight]);

  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= fallSpeed) {
        lastUpdateRef.current = timestamp;
        if (!isClearing && !checkAndReset()) {
          setFallingPiece(prevPiece => {
            if (!prevPiece) return createNewPiece();
            const newY = prevPiece.y + 1;
            if (canPlacePiece(prevPiece, prevPiece.x, newY)) {
              return { ...prevPiece, y: newY };
            } else {
              placePiece(prevPiece);
              setTimeout(clearFullLines, 50);
              return createNewPiece();
            }
          });
        }
      }
      frameRef.current = requestAnimationFrame(gameLoop);
    };
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [canPlacePiece, createNewPiece, placePiece, clearFullLines, checkAndReset, isClearing, fallSpeed]);

  const renderGrid = () => {
    const displayGrid = grid.map(row => row.map(cell => ({ ...cell })));
    if (fallingPiece && !isClearing) {
      for (let row = 0; row < fallingPiece.shape.length; row++) {
        for (let col = 0; col < fallingPiece.shape[row].length; col++) {
          if (fallingPiece.shape[row][col]) {
            const gridX = fallingPiece.x + col;
            const gridY = fallingPiece.y + row;
            if (gridY >= 0 && gridY < gridHeight && gridX >= 0 && gridX < gridWidth) {
              displayGrid[gridY][gridX] = { filled: true, color: fallingPiece.color };
            }
          }
        }
      }
    }
    return displayGrid.map((row, rowIndex) => (
      <div key={rowIndex} className="flex">
        {row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`${cellSize} border border-zinc-800 transition-all duration-100 ${
              cell.filled 
                ? `${cell.color} scale-100 shadow-sm shadow-red-600/50` 
                : 'bg-zinc-900 scale-95'
            }`}
          />
        ))}
      </div>
    ));
  };

  return (
    <div className="border-2 border-red-600 bg-black p-1 rounded shadow-lg shadow-red-600/30">
      {renderGrid()}
    </div>
  );
};

export default TetrisAnimation;
