import { useEffect, useMemo } from 'react';
import { Character } from './types';
import {
  getImagePath,
  getDefaultAvatar,
  seededRandom,
  fireWinConfetti,
} from './utils';
import {
  getTodayDateKey,
  getDailyClassicCharacter,
  useDailyImageTarget,
  useDailyGuesses,
} from './charachterPickLogic';
import SearchBox from './components/SearchBox';
import WinCard from './components/WinCard';
import { buildShareText, imageWonKey } from './share';

const ZOOM_STEPS = [7, 5, 3.7, 2.6, 1.9, 1.4, 1];

function ImageGame({ halloween }: { halloween: boolean }) {
  const dateKey = useMemo(() => getTodayDateKey(), []);

  // Today's classic target is excluded so Image never collides with Classic
  const classicTarget = useMemo(() => getDailyClassicCharacter(dateKey), [dateKey]);
  const target = useDailyImageTarget(dateKey, classicTarget?.name);

  const focusX = seededRandom(`bilde-x-${dateKey}`) * 100;
  const focusY = seededRandom(`bilde-y-${dateKey}`) * 100;

  const [guesses, setGuesses] = useDailyGuesses(`komtekle-bilde-${dateKey}`);

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
          <SearchBox guessedNames={guesses.map((g) => g.name)} onGuess={handleGuess} halloween={halloween} showImages={false} />
        </div>
      )}

      {guesses.length > 0 && (
        <div className="w-full max-w-md flex flex-col gap-2 pb-4">
          {guesses.map((guess) => (
            <div
              key={guess.name}
              className={`flex items-center gap-3 p-2 rounded-2xl shadow-lg shadow-black/50 animate-fade-in-up ${guess.name === target?.name ? 'bg-green-500' : 'bg-red-500'
                }`}
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