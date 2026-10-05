import { useState, useEffect, useMemo, KeyboardEvent } from 'react';
import confetti from 'canvas-confetti';
import characterData from './data/characters.json';
import { GAME_FEATURES } from './gameConfig';
import { Character } from './types';
import {
  getDailyCharacter,
  getImagePath,
  getFeatureValue,
  evaluateFeature,
  isPotentialAnswer
} from './utils';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const { target, dateKey } = useMemo(() => getDailyCharacter(), []);

  const [guesses, setGuesses] = useState<Character[]>(() => {
    const saved = localStorage.getItem(`komtekle-${dateKey}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(`komtekle-${dateKey}`, JSON.stringify(guesses));
  }, [guesses, dateKey]);

  const hasWon = guesses.length > 0 && guesses[0].name === target.name;

  useEffect(() => {
    if (hasWon) {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    }
  }, [hasWon]);

  const potentialAnswer = !hasWon && guesses.length > 0 && isPotentialAnswer(guesses[0], target);

  const filteredCharacters = (characterData as Character[]).filter(char =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !guesses.some(g => g.name === char.name)
  );

  const handleGuess = (character: Character) => {
    if (hasWon || !character) return;
    setGuesses([character, ...guesses]);
    setSearchTerm('');
    setActiveIndex(0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (filteredCharacters.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredCharacters.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleGuess(filteredCharacters[activeIndex]);
    }
  };

  // --- DYNAMIC SHARE LOGIC ---
  const shareResult = () => {
    const emojiGrid = [...guesses].reverse().map(g => {
      // Create a green/yellow/red square for every feature configured in GAME_FEATURES
      return ['🟩', ...GAME_FEATURES.map(feature => {
        const gVal = getFeatureValue(g, feature.key);
        const tVal = getFeatureValue(target, feature.key);
        const { color } = evaluateFeature(gVal, tVal, feature);
        return color === 'green' ? '🟩' : color === 'yellow' ? '🟨' : '🟥';
      })].join(''); // Includes a forced green square for the Name Image block
    }).join('\n');

    const shareText = `Komtekle - ${dateKey}\nFant i ${guesses.length} forsøk!\n\n${emojiGrid}\n\nhttps://komtekle.netlify.app`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans flex flex-col items-center py-6 md:py-10 px-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-wider text-green-500">KOMTEKLE</h1>
      <p className="text-gray-400 mb-6 md:mb-8 text-center max-w-md">Gjett hva eller hvem som er riktig svar i dag!</p>

      {hasWon ? (
        <div className="mb-10 text-center animate-fade-in-up">
          <h2 className="text-3xl font-bold text-green-500 mb-2">Så flink du er! 🎉</h2>
          <p className="text-gray-400 mb-6">Du fant dagens karakter i {guesses.length} forsøk.</p>
          <button
            onClick={shareResult}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded shadow-lg transition-colors cursor-pointer"
          >
            {copied ? 'Kopiert!' : 'Del resultat 📋'}
          </button>
        </div>
      ) : (
        <div className="relative w-full max-w-md mb-10 z-20">
          {potentialAnswer && (
            <div className="mb-3 p-3 rounded bg-yellow-500 text-black text-center">
              <div className="font-semibold">Ekvivalent svar!</div>
              {guesses[0].name} er veldig lik som svaret, men er ikke riktig!
            </div>
          )}
          <input
            type="text"
            placeholder="Skriv inn et navn..."
            className="w-full p-4 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-green-500"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
          />

          {searchTerm.length > 0 && filteredCharacters.length > 0 && (
            <ul className="absolute z-10 w-full bg-gray-800 border border-gray-700 mt-1 max-h-60 overflow-y-auto rounded shadow-xl">
              {filteredCharacters.map((char, index) => (
                <li
                  key={char.name}
                  className={`p-3 cursor-pointer border-b border-gray-700 last:border-b-0 flex items-center gap-3 ${index === activeIndex ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
                  onClick={() => handleGuess(char)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <img
                    src={getImagePath(char.name)}
                    alt={char.name}
                    className="w-8 h-8 rounded-full object-cover bg-gray-900 border border-gray-600"
                    onError={(e) => { e.currentTarget.src = char.gender === 'Kvinne' ? '/character_images/default_female_avatar.jpg' : '/character_images/default_male_avatar.jpg'; }}
                  />
                  {char.name}
                </li>
              ))}
            </ul>
          )}
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
                  onError={(e) => { e.currentTarget.src = guess.gender === 'Kvinne' ? '/character_images/default_female_avatar.jpg' : '/character_images/default_male_avatar.jpg'; }}
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

            {/* DYNAMIC HEADERS */}
            <div className="flex gap-2 text-xs font-bold text-gray-400 uppercase text-center pb-2 border-b border-gray-700">
              <div className="w-24 shrink-0">Karakter</div>
              {GAME_FEATURES.map((feature) => (
                <div key={feature.key} className={`${feature.widthClass} shrink-0`}>
                  {feature.label}
                </div>
              ))}
            </div>

            {/* DYNAMIC ROWS */}
            {guesses.map((guess) => (
              <div key={guess.name} className="flex gap-2 text-center text-sm font-semibold animate-fade-in-up">

                {/* Character Name / Image Block (Always present) */}
                <div className="w-24 h-24 shrink-0 flex flex-col items-center justify-end bg-gray-900 border border-gray-600 rounded overflow-hidden relative">
                  <img
                    src={getImagePath(guess.name)}
                    alt={guess.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                    onError={(e) => { e.currentTarget.src = guess.gender === 'Kvinne' ? '/character_images/default_female_avatar.jpg' : '/character_images/default_male_avatar.jpg'; }}
                  />
                  <span className="relative z-10 bg-black/80 px-1 py-0.5 text-[10px] leading-tight break-words w-full text-center">
                    {guess.name}
                  </span>
                </div>

                {/* Dynamically Generate Property Blocks */}
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
    </div>
  );
}

export default App;