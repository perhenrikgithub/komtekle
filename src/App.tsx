import { useState, useMemo } from 'react';
import { isHalloween } from './utils';
import ClassicGame from './ClassicGame';
import ImageGame from './ImageGame';

type Mode = 'klassisk' | 'bilde';

const MODES: { key: Mode; label: string }[] = [
  { key: 'klassisk', label: 'Klassisk' },
  { key: 'bilde', label: 'Bilde' },
];

const getModeFromUrl = (): Mode =>
  new URLSearchParams(window.location.search).get('mode') === 'bilde' ? 'bilde' : 'klassisk';

function App() {
  const halloween = useMemo(() => isHalloween(), []);
  const [mode, setMode] = useState<Mode>(getModeFromUrl);

  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    // Keep the mode in the URL so links can be shared (other params like ?halloween are kept)
    const params = new URLSearchParams(window.location.search);
    if (newMode === 'bilde') params.set('mode', 'bilde');
    else params.delete('mode');
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  };

  const subtitle =
    mode === 'bilde'
      ? (halloween ? 'Gjett hvem som gjemmer seg på bildet! 👻' : 'Gjett hvem som er på bildet!')
      : (halloween ? 'Gjett hva eller hvem som hjemsøker oss i dag! 👻' : 'Gjett hva eller hvem som er riktig svar i dag!');

  return (
    <div
      className="min-h-screen bg-[#121212] text-white font-sans flex flex-col items-center py-6 md:py-10 px-4"
      style={halloween ? { backgroundImage: 'radial-gradient(ellipse at top, rgba(249, 115, 22, 0.18), rgba(124, 58, 237, 0.12) 40%, transparent 70%)' } : undefined}
    >
      <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-wider text-white">
        {halloween ? '🎃 Komtekle 🦇' : 'Komtekle'}
      </h1>

      <div className="flex gap-1 p-1 mb-4 bg-gray-800 rounded-full shadow-lg shadow-black/50">
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => changeMode(key)}
            className={`px-6 py-2 rounded-full font-semibold transition-colors cursor-pointer ${mode === key ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-gray-400 mb-6 md:mb-8 text-center max-w-md">{subtitle}</p>

      {mode === 'bilde' ? <ImageGame halloween={halloween} /> : <ClassicGame halloween={halloween} />}
    </div>
  );
}

export default App;
