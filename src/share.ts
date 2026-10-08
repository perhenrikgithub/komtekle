import { GAME_FEATURES } from './gameConfig';
import { Character } from './types';
import { getDailyCharacter, getFeatureValue, evaluateFeature } from './utils';

const loadGuesses = (key: string): Character[] => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
};

export const imageWonKey = (dateKey: string) => `komtekle-bilde-vunnet-${dateKey}`;

// Classic result, or null if today's classic game isn't won
const classicSection = (): string | null => {
    const { target, dateKey } = getDailyCharacter();
    const guesses = loadGuesses(`komtekle-${dateKey}`);
    if (guesses.length === 0 || guesses[0].name !== target.name) return null;

    const emojiGrid = [...guesses].reverse().map(g => {
        // Create a green/yellow/red square for every feature configured in GAME_FEATURES
        return ['🟩', ...GAME_FEATURES.map(feature => {
            const gVal = getFeatureValue(g, feature.key);
            const tVal = getFeatureValue(target, feature.key);
            const { color } = evaluateFeature(gVal, tVal, feature);
            return color === 'green' ? '🟩' : color === 'yellow' ? '🟨' : '🟥';
        })].join(''); // Includes a forced green square for the Name Image block
    }).join('\n');

    return `Klassisk: ${guesses.length} forsøk\n${emojiGrid}`;
};

// Image mode result, or null if not won. The newest guess is the correct one when won.
const imageSection = (dateKey: string): string | null => {
    if (localStorage.getItem(imageWonKey(dateKey)) !== '1') return null;
    const guesses = loadGuesses(`komtekle-bilde-${dateKey}`);
    const squares = guesses.map((_, i) => (i === 0 ? '🟩' : '🟥')).reverse().join('');
    return `Bilde: ${guesses.length} forsøk\n${squares}`;
};

// Shared result for every game mode won today
export const buildShareText = (): string => {
    const { dateKey } = getDailyCharacter();
    const sections = [classicSection(), imageSection(dateKey)].filter(Boolean);
    return `Komtekle - ${dateKey}\n\n${sections.join('\n\n')}\n\nhttps://komtekle.netlify.app`;
};
