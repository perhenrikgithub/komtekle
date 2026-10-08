import { useState } from 'react';

interface WinCardProps {
  guessCount: number;
  halloween: boolean;
  getShareText: () => string;
}

function WinCard({ guessCount, halloween, getShareText }: WinCardProps) {
  const [copied, setCopied] = useState(false);

  const shareResult = () => {
    navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-md mb-10 p-6 text-center bg-gray-800 border border-gray-600 rounded-2xl shadow-lg shadow-black/50 animate-fade-in-up">
      {halloween && (
        <img src="/doot.gif" alt="Skjelett som spiller trompet" className="mx-auto mb-4 w-40 rounded-2xl" />
      )}
      <h2 className="text-3xl font-bold text-white mb-2">Så flink du er! 🎉</h2>
      <p className="text-gray-400 mb-6">Du fant dagens karakter i {guessCount} forsøk.</p>
      <button
        onClick={shareResult}
        className="bg-white hover:bg-gray-200 text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg transition-colors cursor-pointer"
      >
        {copied ? 'Kopiert!' : 'Del resultat 📋'}
      </button>
    </div>
  );
}

export default WinCard;
