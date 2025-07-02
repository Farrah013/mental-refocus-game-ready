// src/App.jsx
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
    width: 64,
    height: 64,
    backgroundColor: color,
  };

  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div style={shapeStyle} />
    </motion.div>
  );
}

function playSound(name) {
  const audio = new Audio(`${process.env.PUBLIC_URL}/sounds/${name}.mp3`);
  audio.play();
}

function TopographicBackground({ children }) {
  return (
    <div
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/immersion-lines.svg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "1rem",
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
    let interval = Math.max(500, 3000 - (stage - 1) * 250);
    setIsFlashing(true);
    let flashes = [];

    timerRef.current = setInterval(() => {
      const item = {
        shape: getRandomElement(shapes),
        color: getRandomElement(colors),
      };
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
    setStage((s) => s + 1);
  };

  const renderResults = () => {
    const correct = flashHistory.filter((item, i) => item.shape === selections[i]);
    const points = correct.length * 10;
    const newScore = score + points;
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
          You got {correct.length} of {flashHistory.length} right!
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
      <div className="bg-white bg-opacity-80 rounded-xl shadow-xl p-6 max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold mb-2">Mental Refocus Game</h1>

        <div className="flex items-center justify-between mb-4">
          <p>Stage: {stage}</p>

          {/* Score + Shape in one group */}
          <div className="flex items-center">
            <p className="mr-4">Score: {score}</p>
            <div className="w-16 h-16">
              <AnimatePresence>
                {isFlashing && currentShape && (
                  <ShapeFlasher {...currentShape} key={JSON.stringify(currentShape)} />
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            onClick={() => setMuted((m) => !m)}
            className="text-sm text-gray-600 underline"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>

        {/* Only show the recall buttons or “Get ready” */}
        {!isFlashing && flashHistory.length > 0 ? (
          <div>
            <p>Select the shapes in order:</p>
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

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="mt-6 text-left">
            <h2 className="text-xl font-semibold mb-2">Leaderboard</h2>
            <ul>
              {leaderboard.map((e, i) => (
                <li key={i}>
                  {i + 1}. {e.name}: {e.score}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </TopographicBackground>
  );
}
