// components/LoadingScreen.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingScreenProps {
  isLoading: boolean;
  onLoadingComplete: () => void;
}

// Tetris pieces - themed for Zero Error Esports
const TETRIS_PIECES = [
  // I-piece
  { shape: [[1, 1, 1, 1]], color: 'bg-red-600' },
  // O-piece
  { shape: [[1, 1], [1, 1]], color: 'bg-red-600' },
  // T-piece
  { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-red-600' },
  // L-piece
  { shape: [[1, 0], [1, 0], [1, 1]], color: 'bg-red-600' },
  // S-piece
  { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-red-600' },
  // Z-piece
  { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-600' },
  // J-piece
  { shape: [[0, 1], [0, 1], [1, 1]], color: 'bg-red-600' },
]

interface Cell {
  filled: boolean
  color: string
}

interface FallingPiece {
  shape: number[][]
  color: string
  x: number
  y: number
  id: string
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading,
  onLoadingComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [loadingText, setLoadingText] = useState("INITIALIZING");

  // Tetris configuration
  const gridWidth = 10;
  const gridHeight = 12;
  const cellSize = 'w-3 h-3';
  const fallSpeed = 60;

  const [grid, setGrid] = useState<Cell[][]>(() =>
    Array(gridHeight).fill(null).map(() => 
      Array(gridWidth).fill(null).map(() => ({ filled: false, color: '' }))
    )
  )
  const [fallingPiece, setFallingPiece] = useState<FallingPiece | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const frameRef = useRef<number | undefined>(undefined)
  const lastUpdateRef = useRef<number>(0)

  const loadingTexts = [
    "INITIALIZING",
    "LOADING ASSETS",
    "PREPARING INTERFACE",
    "ESTABLISHING CONNECTION",
    "LAUNCHING",
  ];

  // Rotate a shape 90 degrees clockwise
  const rotateShape = useCallback((shape: number[][]): number[][] => {
    const rows = shape.length
    const cols = shape[0].length
    const rotated: number[][] = Array(cols).fill(null).map(() => Array(rows).fill(0))

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = shape[i][j]
      }
    }

    return rotated
  }, [])

  // Create a new random piece
  const createNewPiece = useCallback((): FallingPiece => {
    const pieceData = TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)]
    let shape = pieceData.shape
    
    // Random rotations
    const rotations = Math.floor(Math.random() * 4)
    for (let i = 0; i < rotations; i++) {
      shape = rotateShape(shape)
    }

    const maxX = gridWidth - shape[0].length
    const x = Math.floor(Math.random() * (maxX + 1))

    return {
      shape,
      color: pieceData.color,
      x,
      y: -shape.length,
      id: Math.random().toString(36).substr(2, 9),
    }
  }, [rotateShape])

  // Check if a piece can be placed at a position
  const canPlacePiece = useCallback((piece: FallingPiece, newX: number, newY: number): boolean => {
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const gridX = newX + col
          const gridY = newY + row

          // Check boundaries
          if (gridX < 0 || gridX >= gridWidth || gridY >= gridHeight) {
            return false
          }

          // Check collision with placed pieces
          if (gridY >= 0 && grid[gridY][gridX].filled) {
            return false
          }
        }
      }
    }
    return true
  }, [grid])

  // Place a piece on the grid
  const placePiece = useCallback((piece: FallingPiece) => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })))

      for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
          if (piece.shape[row][col]) {
            const gridX = piece.x + col
            const gridY = piece.y + row

            if (gridY >= 0 && gridY < gridHeight && gridX >= 0 && gridX < gridWidth) {
              newGrid[gridY][gridX] = { filled: true, color: piece.color }
            }
          }
        }
      }

      return newGrid
    })
  }, [])

  // Clear completed lines with animation
  const clearFullLines = useCallback(() => {
    setGrid(prevGrid => {
      const linesToClear: number[] = []
      
      // Find full lines
      prevGrid.forEach((row, index) => {
        if (row.every(cell => cell.filled)) {
          linesToClear.push(index)
        }
      })

      if (linesToClear.length > 0) {
        setIsClearing(true)
        
        // Mark lines for clearing animation
        const newGrid = prevGrid.map((row, rowIndex) => {
          if (linesToClear.includes(rowIndex)) {
            return row.map(cell => ({ ...cell, color: 'bg-red-400 animate-pulse' }))
          }
          return row
        })

        // Actually clear lines after animation
        setTimeout(() => {
          setGrid(currentGrid => {
            const filteredGrid = currentGrid.filter((_, index) => !linesToClear.includes(index))
            const emptyRows = Array(linesToClear.length).fill(null).map(() => 
              Array(gridWidth).fill(null).map(() => ({ filled: false, color: '' }))
            )
            setIsClearing(false)
            return [...emptyRows, ...filteredGrid]
          })
        }, 200)

        return newGrid
      }

      return prevGrid
    })
  }, [])

  // Check if we need to reset (grid getting too full)
  const checkAndReset = useCallback(() => {
    const topRows = grid.slice(0, 3)
    const needsReset = topRows.some(row => row.filter(cell => cell.filled).length > gridWidth * 0.7)

    if (needsReset) {
      setIsClearing(true)
      setTimeout(() => {
        setGrid(Array(gridHeight).fill(null).map(() => 
          Array(gridWidth).fill(null).map(() => ({ filled: false, color: '' }))
        ))
        setFallingPiece(null)
        setIsClearing(false)
      }, 500)
      return true
    }
    return false
  }, [grid])

  // Tetris game loop
  useEffect(() => {
    if (!isLoading) return;

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= fallSpeed) {
        lastUpdateRef.current = timestamp

        if (!isClearing && !checkAndReset()) {
          setFallingPiece(prevPiece => {
            if (!prevPiece) {
              return createNewPiece()
            }

            const newY = prevPiece.y + 1

            if (canPlacePiece(prevPiece, prevPiece.x, newY)) {
              return { ...prevPiece, y: newY }
            } else {
              // Place piece and create new one
              placePiece(prevPiece)
              setTimeout(clearFullLines, 50)
              return createNewPiece()
            }
          })
        }
      }

      frameRef.current = requestAnimationFrame(gameLoop)
    }

    frameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [canPlacePiece, createNewPiece, placePiece, clearFullLines, checkAndReset, isClearing, isLoading])

  // Progress tracking
  useEffect(() => {
    if (!isLoading) return;

    const hasLoadedBefore = sessionStorage.getItem("hasLoadedSite");
    const startTime = Date.now();
    const duration = hasLoadedBefore ? 1500 : 4000;

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(rawProgress) * 100;
      setProgress(easedProgress);

      if (easedProgress > 20 && easedProgress <= 40) {
        setLoadingText(loadingTexts[1]);
      } else if (easedProgress > 40 && easedProgress <= 60) {
        setLoadingText(loadingTexts[2]);
      } else if (easedProgress > 60 && easedProgress <= 80) {
        setLoadingText(loadingTexts[3]);
      } else if (easedProgress > 80) {
        setLoadingText(loadingTexts[4]);
      }

      if (rawProgress >= 1) {
        clearInterval(interval);
        setFadeOut(true);
        setTimeout(() => {
          sessionStorage.setItem("hasLoadedSite", "true");
          onLoadingComplete();
        }, 1200);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isLoading, onLoadingComplete]);

  // Render the Tetris grid
  const renderGrid = () => {
    const displayGrid = grid.map(row => row.map(cell => ({ ...cell })))

    // Add falling piece to display
    if (fallingPiece && !isClearing) {
      for (let row = 0; row < fallingPiece.shape.length; row++) {
        for (let col = 0; col < fallingPiece.shape[row].length; col++) {
          if (fallingPiece.shape[row][col]) {
            const gridX = fallingPiece.x + col
            const gridY = fallingPiece.y + row

            if (gridY >= 0 && gridY < gridHeight && gridX >= 0 && gridX < gridWidth) {
              displayGrid[gridY][gridX] = { filled: true, color: fallingPiece.color }
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
    ))
  }

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          animate={{ opacity: fadeOut ? 0 : 1 }}
          transition={{
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Title */}
            <div className="mb-8 relative">
              <motion.h1 className="text-6xl md:text-7xl font-black uppercase text-shadow-lg">
                <motion.span className="text-red-600 inline-block">
                  ZERO
                </motion.span>{" "}
                ERROR
              </motion.h1>
              <motion.div className="absolute -bottom-4 left-0 right-0 text-center text-sm text-red-600 uppercase tracking-widest font-bold">
                ESPORTS
              </motion.div>
            </div>

            {/* Tetris Loading Animation */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="border-2 border-red-600 bg-black p-1 rounded shadow-lg shadow-red-600/30">
                {renderGrid()}
              </div>
            </motion.div>

            {/* Loading Text */}
            <div className="mt-2 text-xs text-zinc-400 font-mono">
              <motion.div className="flex items-center">
                <motion.span
                  className="mr-2 inline-block w-2 h-2 bg-red-600 rounded-full"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                  }}
                />
                {loadingText}... {Math.round(progress)}%
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
