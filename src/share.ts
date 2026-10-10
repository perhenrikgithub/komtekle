import { GAME_FEATURES } from './gameConfig';
import { Character } from './types';
import {
    getFeatureValue,
    evaluateFeature,
} from './utils';
import {
    getTodayDateKey,
    getDailyClassicCharacter,
} from "./charachterPickLogic";

const loadGuesses = (key: string): Character[] => {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    try {
        return JSON.parse(saved);
    } catch {
        return [];
    }
};

export const imageWonKey = (dateKey: string) => `komtekle-bilde-vunnet-${dateKey}`;

// Classic result, or null if today's classic game isn't won
const classicSection = (dateKey: string): string | null => {
    const target = getDailyClassicCharacter(dateKey);
    if (!target) return null;

    const guesses = loadGuesses(`komtekle-${dateKey}`);
    if (guesses.length === 0 || guesses[0].name !== target.name) return null;

    // Newest guess is first in state, reverse to show chronological order
    const emojiGrid = [...guesses]
        .reverse()
        .map((g) => {
            // First square: green if winning guess, red otherwise
            const nameSquare = g.name === target.name ? '🟩' : '🟥';

            const featureSquares = GAME_FEATURES.map((feature) => {
                const gVal = getFeatureValue(g, feature.key);
                const tVal = getFeatureValue(target, feature.key);
                const { color } = evaluateFeature(gVal, tVal, feature);
                return color === 'green' ? '🟩' : color === 'yellow' ? '🟨' : '🟥';
            });

            return [nameSquare, ...featureSquares].join('');
        })
        .join('\n');

    return `Klassisk: ${guesses.length} forsøk\n${emojiGrid}`;
};

// Image mode result, or null if not won
const imageSection = (dateKey: string): string | null => {
    if (localStorage.getItem(imageWonKey(dateKey)) !== '1') return null;
    const guesses = loadGuesses(`komtekle-bilde-${dateKey}`);
    if (guesses.length === 0) return null;

    // Index 0 is winning guess, reverse so green square is at the end
    const squares = guesses.map((_, i) => (i === 0 ? '🟩' : '🟥')).reverse().join('');
    return `Bilde: ${guesses.length} forsøk\n${squares}`;
};

// Shared result for every game mode won today
export const buildShareText = (): string => {
    const dateKey = getTodayDateKey();
    const sections = [classicSection(dateKey), imageSection(dateKey)].filter(Boolean);

    return `Komtekle - ${dateKey}\n\n${sections.join('\n\n')}\n\nhttps://komtekle.netlify.app`;
};