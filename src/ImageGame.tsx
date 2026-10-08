import { useState, useEffect, useMemo } from 'react';
import characterData from './data/characters.json';
import { Character } from './types';
import { getImagePath, getDefaultAvatar, seededRandom, fireWinConfetti } from './utils';
import SearchBox from './components/SearchBox';
import WinCard from './components/WinCard';
import { buildShareText, imageWonKey } from './share';

// Zoom level per wrong guess. Fully zoomed out after 6 wrong guesses.
const ZOOM_STEPS = [7, 5, 3.7, 2.6, 1.9, 1.4, 1];

// Characters without an image file are skipped: try today's pick and move on until an image loads.
// Every player gets the same result since everyone sees the same files.
const useDailyImageTarget = (dateKey: string) => {
  const [target, setTarget] = useState<Character | null>(null);

  useEffect(() => {
    const characters = characterData as Character[];
    const start = Math.floor(seededRandom(`bilde-${dateKey}`) * characters.length);
    let cancelled = false;

    const tryAttempt = (attempt: number) => {
      if (cancelled || attempt >= characters.length) return;
      const candidate = characters[(start + attempt) % characters.length];
      const img = new Image();
      img.onload = () => { if (!cancelled) setTarget(candidate); };
      img.onerror = () => tryAttempt(attempt + 1);
      img.src = getImagePath(candidate.name);
    };

    tryAttempt(0);
    return () => { cancelled = true; };
  }, [dateKey]);

  return target;
};

function ImageGame({ halloween }: { halloween: boolean }) {
  const dateKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const target = useDailyImageTarget(dateKey);

  // Random point (per day) the image zooms in on, in percent of the image
  const focusX = seededRandom(`bilde-x-${dateKey}`) * 100;
  const focusY = seededRandom(`bilde-y-${dateKey}`) * 100;

  const [guesses, setGuesses] = useState<Character[]>(() => {
    const saved = localStorage.getItem(`komtekle-bilde-${dateKey}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(`komtekle-bilde-${dateKey}`, JSON.stringify(guesses));
  }, [guesses, dateKey]);

  const hasWon = target !== null && guesses.length > 0 && guesses[0].name === target.name;

  useEffect(() => {
    if (!hasWon) return;
    localStorage.setItem(imageWonKey(dateKey), '1');
    fireWinConfetti(halloween);
  }, [hasWon, halloween, dateKey]);

  const wrongGuesses = hasWon ? guesses.length - 1 : guesses.length;
  const step = hasWon ? ZOOM_STEPS.length - 1 : Math.min(wrongGuesses, ZOOM_STEPS.length - 1);
  const zoom = ZOOM_STEPS[step];

  const handleGuess = (character: Character) => {
    if (hasWon || !target) return;
    setGuesses([character, ...guesses]);
  };

  return (
    <>
      <div className="relative w-full max-w-md aspect-square mb-2 overflow-hidden rounded-2xl bg-gray-800 border border-gray-600 shadow-lg shadow-black/50">
        {target ? (
          <img
            src={getImagePath(target.name)}
            alt="Dagens bilde"
            draggable={false}
            className="w-full h-full object-cover transition-transform duration-700 ease-out select-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: `${focusX}% ${focusY}%` }}
          />
        ) : (
          <div className="w-full h-full animate-pulse bg-gray-700" />
        )}
      </div>
      <p className="text-gray-400 text-sm mb-6">
        {hasWon ? 'Hele bildet' : `Zoom ${step + 1}/${ZOOM_STEPS.length} – zoomer ut for hvert feil gjett`}
      </p>

      {hasWon ? (
        <WinCard guessCount={guesses.length} halloween={halloween} getShareText={buildShareText} />
      ) : (
        <div className="relative w-full max-w-md mb-10 z-20">
          <SearchBox guessedNames={guesses.map(g => g.name)} onGuess={handleGuess} halloween={halloween} showImages={false} />
        </div>
      )}

      {guesses.length > 0 && (
        <div className="w-full max-w-md flex flex-col gap-2 pb-4">
          {guesses.map((guess) => (
            <div
              key={guess.name}
              className={`flex items-center gap-3 p-2 rounded-2xl shadow-lg shadow-black/50 animate-fade-in-up ${guess.name === target?.name ? 'bg-green-500' : 'bg-red-500'}`}
            >
              <img
                src={getImagePath(guess.name)}
                alt={guess.name}
                className="w-12 h-12 shrink-0 rounded-full object-cover bg-gray-900 border-2 border-white/30"
                onError={(e) => { e.currentTarget.src = getDefaultAvatar(guess); }}
              />
              <span className="text-lg font-semibold">{guess.name}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default ImageGame;
