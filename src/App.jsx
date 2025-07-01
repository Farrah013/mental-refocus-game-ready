import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

const shapes = ["circle", "square", "triangle", "star"];
const colors = ["red", "blue", "green", "yellow", "purple"];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function ShapeFlasher({ shape, color }) {
  const shapeStyle = {
    borderRadius: shape === "circle" ? "50%" : "0",
    clipPath:
      shape === "triangle"
        ? "polygon(50% 0%, 0% 100%, 100% 100%)"
        : shape === "star"
        ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
        : "none",
    width: 80,
    height: 80,
    backgroundColor: color,
  };

  return (
    <motion.div
      className="w-28 h-28 mx-auto flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <div style={shapeStyle}></div>
    </motion.div>
  );
}

function playSound(name) {
  const audio = new Audio(`/sounds/${name}.mp3`);
  audio.play();
}

function TopographicBackground({ children }) {
  return (
    <div
      style={{
        backgroundImage: 'url("/immersion-lines.svg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      {children}
    </div>
  );
}

export default function ADHDRefocusGame() {
  const [stage, setStage] = useState(1);
  const [currentShape, setCurrentShape] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [selections, setSelections] = useState([]);
  const [flashHistory, setFlashHistory] = useState([]);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [muted, setMuted] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (stage > 10) return;
    let interval = 3000 - (stage - 1) * 250;
    if (interval < 500) interval = 500;

    setIsFlashing(true);
    let flashes = [];

    timerRef.current = setInterval(() => {
      const shape = getRandomElement(shapes);
      const color = getRandomElement(colors);
      const item = { shape, color };
      setCurrentShape(item);
      flashes.push(item);
      if (!muted) playSound("beep");
    }, interval);

    const timeout = setTimeout(() => {
      clearInterval(timerRef.current);
      setFlashHistory(flashes);
      setIsFlashing(false);
      if (!muted) playSound("end");
    }, 60000);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(timeout);
    };
  }, [stage, muted]);

  const handleUserGuess = (shape) => {
    if (!isFlashing) {
      setSelections((prev) => [...prev, shape]);
      if (!muted) playSound("click");
    }
  };

  const handleNextStage = () => {
    setSelections([]);
    setFlashHistory([]);
    setStage((prev) => prev + 1);
  };

  const renderResults = () => {
    const correct = flashHistory.filter((item, idx) => item.shape === selections[idx]);
    const pointsEarned = correct.length * 10;
    const newScore = score + pointsEarned;
    setScore(newScore);
    confetti();
    if (!muted) playSound("success");

    const name = prompt("Enter your name for the leaderboard:");
    if (name) {
      setLeaderboard((prev) =>
        [...prev, { name, score: newScore }]
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
      );
    }

    return (
      <div>
        <p className="text-xl">
          You remembered {correct.length} out of {flashHistory.length} correctly!
        </p>
        <p className="text-lg">Score: {newScore}</p>
        {stage < 10 ? (
          <button
            onClick={handleNextStage}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
          >
            Next Stage
          </button>
        ) : (
          <div>
            <p className="mt-4 text-xl font-bold">Game Over!</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <TopographicBackground>
      <div className="p-6 text-center bg-white bg-opacity-80 rounded-xl shadow-xl max-w-xl w-full">
        <h1 className="text-3xl font-bold mb-4">Mental Refocus Game</h1>
        <div className="flex justify-between items-center mb-4">
          <p>Stage: {stage}</p>
          <p>Score: {score}</p>
          <button
            onClick={() => setMuted(!muted)}
            className="text-sm text-gray-600 underline"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
        <AnimatePresence>
          {isFlashing ? (
            <ShapeFlasher
              key={currentShape?.shape + currentShape?.color + Math.random()}
              shape={currentShape?.shape}
              color={currentShape?.color}
            />
          ) : flashHistory.length > 0 ? (
            <div>
              <p>Select the shapes you remember in order:</p>
              <div className="flex justify-center gap-4 mt-4">
                {shapes.map((shape) => (
                  <button
                    key={shape}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={() => handleUserGuess(shape)}
                  >
                    {shape}
                  </button>
                ))}
              </div>
              {selections.length === flashHistory.length && renderResults()}
            </div>
          ) : (
            <p>Get ready...</p>
          )}
        </AnimatePresence>

        {leaderboard.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Leaderboard</h2>
            <ul>
              {leaderboard.map((entry, index) => (
                <li key={index}>
                  {entry.name}: {entry.score}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </TopographicBackground>
  );
}
