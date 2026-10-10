import { useEffect, useMemo } from 'react';
import { GAME_FEATURES } from './gameConfig';
import { Character } from './types';
import {
  getImagePath,
  getDefaultAvatar,
  getFeatureValue,
  evaluateFeature,
  isPotentialAnswer,
  fireWinConfetti,
} from './utils';
import {
  getTodayDateKey,
  getDailyClassicCharacter,
  useDailyGuesses
} from './charachterPickLogic';

import SearchBox from './components/SearchBox';
import WinCard from './components/WinCard';
import { buildShareText } from './share';

function ClassicGame({ halloween }: { halloween: boolean }) {
  const dateKey = useMemo(() => getTodayDateKey(), []);
  const target = useMemo(() => getDailyClassicCharacter(dateKey), [dateKey]);

  const [guesses, setGuesses] = useDailyGuesses(`komtekle-${dateKey}`);

  const hasWon = guesses.length > 0 && guesses[0].name === target?.name;

  useEffect(() => {
    if (hasWon) fireWinConfetti(halloween);
  }, [hasWon, halloween]);

  if (!target) {
    return (
      <div className="text-center text-gray-400">
        Ingen tilgjengelige karakterer for dagens dato.
      </div>
    );
  }

  const potentialAnswer = !hasWon && guesses.length > 0 && isPotentialAnswer(guesses[0], target);

  const handleGuess = (character: Character) => {
    if (hasWon) return;
    setGuesses([character, ...guesses]);
  };

  return (
    <>
      {hasWon ? (
        <WinCard guessCount={guesses.length} halloween={halloween} getShareText={buildShareText} />
      ) : (
        <div className="relative w-full max-w-md mb-10 z-20">
          {potentialAnswer && (
            <div className="mb-4 p-4 rounded-2xl bg-yellow-500 text-black text-center shadow-lg shadow-black/50 animate-fade-in-up">
              <div className="font-semibold">Ekvivalent svar!</div>
              {guesses[0].name} er veldig lik som svaret, men er ikke riktig!
            </div>
          )}
          <SearchBox guessedNames={guesses.map((g) => g.name)} onGuess={handleGuess} halloween={halloween} />
        </div>
      )}

      {/* MOBILE: one card per guess */}
      {guesses.length > 0 && (
        <div className="md:hidden w-full max-w-md flex flex-col gap-4 pb-4">
          {guesses.map((guess) => (
            <div key={guess.name} className="bg-gray-800 border border-gray-600 rounded-2xl shadow-lg shadow-black/50 p-3 animate-fade-in-up">
              <div className="flex items-center gap-4 pb-3 mb-3 border-b border-gray-700">
                <img
                  src={getImagePath(guess.name)}
                  alt={guess.name}
                  className="w-24 h-24 shrink-0 rounded-full object-cover bg-gray-900 border-2 border-gray-600"
                  onError={(e) => { e.currentTarget.src = getDefaultAvatar(guess); }}
                />
                <span className="text-2xl font-semibold">{guess.name}</span>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {GAME_FEATURES.map((feature) => {
                  const gVal = getFeatureValue(guess, feature.key);
                  const tVal = getFeatureValue(target, feature.key);
                  const { color, arrow, displayValue } = evaluateFeature(gVal, tVal, feature);

                  const bgColor =
                    color === 'green' ? 'bg-green-500' :
                      color === 'yellow' ? 'bg-yellow-500 text-black' :
                        'bg-red-500';

                  return (
                    <div
                      key={feature.key}
                      className={`${feature.mobileSpanClass ?? 'col-span-2'} relative min-h-[5.5rem] flex flex-col items-center justify-center gap-1 p-2 overflow-hidden rounded-xl text-center transition-colors duration-500 ${bgColor}`}
                    >
                      {arrow === 'up' && (
                        <img src="/arrow_up.png" alt="" className="absolute inset-0 w-full h-full object-contain opacity-20" />
                      )}
                      {arrow === 'down' && (
                        <img src="/arrow_down.png" alt="" className="absolute inset-0 w-full h-full object-contain opacity-20" />
                      )}
                      <span className="relative z-10 text-[9px] uppercase leading-tight opacity-80">
                        {feature.label}
                      </span>
                      <span className="relative z-10 text-xs font-semibold leading-tight break-words w-full">
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DESKTOP: table with one row per guess */}
      {guesses.length > 0 && (
        <div className="hidden md:block max-w-5xl overflow-x-auto pb-4">
          <div className="flex flex-col gap-2 min-w-[650px]">
            <div className="flex gap-2 text-xs font-bold text-gray-400 uppercase text-center pb-2 border-b border-gray-700">
              <div className="w-24 shrink-0">Karakter</div>
              {GAME_FEATURES.map((feature) => (
                <div key={feature.key} className={`${feature.widthClass} shrink-0`}>
                  {feature.label}
                </div>
              ))}
            </div>

            {guesses.map((guess) => (
              <div key={guess.name} className="flex gap-2 text-center text-sm font-semibold animate-fade-in-up">
                <div className="w-24 h-24 shrink-0 flex flex-col items-center justify-end bg-gray-900 border border-gray-600 rounded overflow-hidden relative">
                  <img
                    src={getImagePath(guess.name)}
                    alt={guess.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                    onError={(e) => { e.currentTarget.src = getDefaultAvatar(guess); }}
                  />
                  <span className="relative z-10 bg-black/80 px-1 py-0.5 text-[10px] leading-tight break-words w-full text-center">
                    {guess.name}
                  </span>
                </div>

                {GAME_FEATURES.map((feature) => {
                  const gVal = getFeatureValue(guess, feature.key);
                  const tVal = getFeatureValue(target, feature.key);
                  const { color, arrow, displayValue } = evaluateFeature(gVal, tVal, feature);

                  const bgColor =
                    color === 'green' ? 'bg-green-500' :
                      color === 'yellow' ? 'bg-yellow-500 text-black' :
                        'bg-red-500';

                  return (
                    <div
                      key={feature.key}
                      className={`${feature.widthClass} shrink-0 flex items-center justify-center p-2 overflow-hidden rounded border border-gray-900 shadow transition-colors duration-500 ${bgColor} relative`}
                    >
                      {arrow === 'up' && (
                        <img src="/arrow_up.png" alt="" className="absolute inset-0 w-full h-full object-contain opacity-20" />
                      )}
                      {arrow === 'down' && (
                        <img src="/arrow_down.png" alt="" className="absolute inset-0 w-full h-full object-contain opacity-20" />
                      )}
                      <span className="relative z-10 text-xs break-words">
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default ClassicGame;