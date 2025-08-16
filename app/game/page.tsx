'use client';

import { useState } from "react";

export default function GamePage() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  const startGame = () => {
    setRound(1);
    setScore(0);
    setShowPopup(false);
  };

  const nextRound = () => {
    if (round < 5) {
      setScore((s) => s + 10);
      setRound((r) => r + 1);
    } else {
      setScore((s) => s + 10);
      setShowPopup(true);
      setRound(0);
    }
  };

  const exitGame = () => {
    setRound(0);
    setShowPopup(false);
  };

  const newGame = () => {
    setRound(1);
    setScore(0);
    setShowPopup(false);
  };

  const buttonLabel = round === 5 ? "Finish" : "Next Round";

  return (
    <main className="flex flex-col items-center justify-center h-full">
      <div className="relative w-full max-w-xl aspect-square border bg-neutral-100">
        {round === 0 && !showPopup && (
          <button
            onClick={startGame}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Start Game
          </button>
        )}
      </div>
      {round > 0 && !showPopup && (
        <button
          onClick={nextRound}
          className="mt-4 px-4 py-2 bg-black text-white rounded-md"
        >
          {buttonLabel}
        </button>
      )}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-4 rounded-md shadow text-center space-y-4">
            <p>Your score: {score}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={newGame} className="px-3 py-1 border rounded-md">
                Start New Game
              </button>
              <button onClick={exitGame} className="px-3 py-1 border rounded-md">
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

