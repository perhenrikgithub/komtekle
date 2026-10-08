import { useState, KeyboardEvent } from 'react';
import characterData from '../data/characters.json';
import { Character } from '../types';
import { getImagePath, getDefaultAvatar } from '../utils';

interface SearchBoxProps {
  guessedNames: string[];
  onGuess: (character: Character) => void;
  halloween: boolean;
  showImages?: boolean;
}

function SearchBox({ guessedNames, onGuess, halloween, showImages = true }: SearchBoxProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredCharacters = (characterData as Character[]).filter(char =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !guessedNames.includes(char.name)
  );

  const handleGuess = (character: Character) => {
    if (!character) return;
    onGuess(character);
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

  return (
    <div className="relative">
      <div className="relative">
        <svg
          className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          placeholder="Skriv inn et navn..."
          className={`w-full py-4 pl-14 pr-6 rounded-full bg-white text-gray-900 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 ${halloween ? 'focus:ring-orange-500' : 'focus:ring-green-500'}`}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setActiveIndex(0); }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {searchTerm.length > 0 && filteredCharacters.length > 0 && (
        <ul className="absolute z-10 w-full bg-gray-800 border border-gray-700 mt-1 max-h-60 overflow-y-auto rounded shadow-xl">
          {filteredCharacters.map((char, index) => (
            <li
              key={char.name}
              className={`p-3 cursor-pointer border-b border-gray-700 last:border-b-0 flex items-center gap-3 ${index === activeIndex ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
              onClick={() => handleGuess(char)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {showImages && (
                <img
                  src={getImagePath(char.name)}
                  alt={char.name}
                  className="w-8 h-8 rounded-full object-cover bg-gray-900 border border-gray-600"
                  onError={(e) => { e.currentTarget.src = getDefaultAvatar(char); }}
                />
              )}
              {char.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBox;
