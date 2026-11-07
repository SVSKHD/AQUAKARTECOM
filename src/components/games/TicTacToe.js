import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const getWinner = (board) => {
  for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
    const [a, b, c] = WINNING_COMBINATIONS[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every((cell) => cell !== null)) return "Draw";
  return null;
};

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); // Player is X
  // Both follow from the board, so they are derived rather than stored.
  const winner = getWinner(board);
  const isCpuThinking = !isXNext && !winner;

  // CPU turn, after a 700ms "thinking" delay.
  useEffect(() => {
    if (!isCpuThinking) return undefined;
    const timer = setTimeout(() => {
      const emptyIndices = board
        .map((val, idx) => (val === null ? idx : null))
        .filter((val) => val !== null);

      if (emptyIndices.length > 0) {
        const randomIndex =
          emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        const newBoard = [...board];
        newBoard[randomIndex] = "O";
        setBoard(newBoard);
        setIsXNext(true);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [board, isCpuThinking]);

  const handleClick = (index) => {
    if (board[index] || winner || isCpuThinking) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setIsXNext(false);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex items-center justify-between w-full max-w-[280px]">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
              isXNext && !winner
                ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/30"
                : "bg-white/20 text-slate-500"
            }`}
          >
            You
          </span>
          <span className="text-slate-300 text-xs">vs</span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
              !isXNext && !winner
                ? "bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30"
                : "bg-white/20 text-slate-500"
            }`}
          >
            CPU
          </span>
        </div>
        <button
          onClick={resetGame}
          className="rounded-full p-2 text-slate-400 hover:bg-white/20 hover:text-slate-600 transition-colors"
          title="Restart Game"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/30 p-3 backdrop-blur-md shadow-inner border border-white/40">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            disabled={!!cell || !!winner || isCpuThinking}
            className="relative flex h-20 w-20 items-center justify-center rounded-xl bg-white/60 text-3xl font-black shadow-sm transition-all hover:bg-white/80 disabled:hover:bg-white/60 active:scale-95"
          >
            <AnimatePresence>
              {cell && (
                <motion.span
                  initial={{ scale: 0, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={
                    cell === "X" ? "text-emerald-500" : "text-indigo-500"
                  }
                >
                  {cell}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 rounded-xl bg-white px-6 py-3 shadow-xl border border-emerald-100"
          >
            <p className="text-sm font-bold text-slate-900">
              {winner === "Draw" ? (
                <span className="text-slate-500">It's a Draw! 🤝</span>
              ) : winner === "X" ? (
                <span className="text-emerald-600">You Won! 🎉</span>
              ) : (
                <span className="text-indigo-600">CPU Won! 🤖</span>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicTacToe;
