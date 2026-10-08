import confetti from 'canvas-confetti';
import { FeatureConfig, ComparisonResult, Character } from './types';
import characterData from './data/characters.json';

export const getImagePath = (name: string): string => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9æøå]/gi, '');
    return `/character_images/${cleanName}.jpg`;
};

export const getDailyCharacter = () => {
    const definedName = ""; // Force a specific character here if needed
    const dateKey = new Date().toISOString().slice(0, 10);

    if (definedName) {
        const character = characterData.find(char => char.name === definedName);
        if (character) return { target: character as Character, dateKey };
    }

    // Deterministically select a character based on date
    const seed = Number(dateKey.replaceAll("-", ""));
    const index = seed % characterData.length;

    return { target: characterData[index] as Character, dateKey };
};

// Safely extracts a value from the character, checking for alternative hyphen/underscore spellings
export const getFeatureValue = (char: Character, key: string) => {
    if (char[key] !== undefined) return char[key];
    if (key === 'certified mojavebabe') return char['certified_mojavebabe'];
    if (key === 'verv-whipped') return char['verv_whipped'];
    return undefined;
};

// THE MASTER EVALUATION FUNCTION
export const evaluateFeature = (guessValue: any, targetValue: any, config: FeatureConfig): ComparisonResult => {
    const gVal = guessValue ?? '';
    const tVal = targetValue ?? '';

    const displayValue = Array.isArray(gVal) ? gVal.join(', ') : String(gVal);

    if (config.type === 'EXACT') {
        const match = String(gVal).trim().toLowerCase() === String(tVal).trim().toLowerCase();
        return { color: match ? 'green' : 'red', displayValue };
    }

    if (config.type === 'PARTIAL') {
        const gArr = Array.isArray(gVal) ? gVal : (gVal ? [String(gVal)] : []);
        const tArr = Array.isArray(tVal) ? tVal : (tVal ? [String(tVal)] : []);

        const gNorm = gArr.map(r => String(r).trim().toLowerCase());
        const tNorm = tArr.map(r => String(r).trim().toLowerCase());

        const matches = gNorm.filter(r => tNorm.includes(r));

        let color: 'green' | 'yellow' | 'red' = 'red';
        if (matches.length > 0) {
            color = (matches.length === gNorm.length && matches.length === tNorm.length) ? 'green' : 'yellow';
        }
        return { color, displayValue };
    }

    if (config.type === 'RANKED') {
        const ranks = config.rankOrder || [];
        const gIndex = ranks.indexOf(String(gVal));
        const tIndex = ranks.indexOf(String(tVal));

        if (gIndex === -1 || tIndex === -1) return { color: 'red', displayValue };

        const diff = Math.abs(gIndex - tIndex);
        let color: 'green' | 'yellow' | 'red' = 'red';
        if (diff === 0) color = 'green';
        else if (diff === 1) color = 'yellow';

        let arrow: 'up' | 'down' | null = null;
        if (gIndex < tIndex) arrow = 'up';
        else if (gIndex > tIndex) arrow = 'down';

        return { color, arrow, displayValue };
    }

    return { color: 'red', displayValue };
};

export const isPotentialAnswer = (guess: Character, target: Character): boolean => {
    if (!guess || !target) return false;

    // Type-safe way to omit the 'name' property
    const { name: guessName, ...guessRest } = guess;
    const { name: targetName, ...targetRest } = target;

    return JSON.stringify(guessRest) === JSON.stringify(targetRest);
};
// Halloween mode: Oct 15 – Nov 1 (local time). Add ?halloween to the URL to force it on for testing.
export const isHalloween = (date: Date = new Date()): boolean => {
    if (new URLSearchParams(window.location.search).has('halloween')) return true;
    const month = date.getMonth(); // 0-indexed: 9 = October, 10 = November
    const day = date.getDate();
    return (month === 9 && day >= 15) || (month === 10 && day === 1);
};

export const getDefaultAvatar = (char: Character): string =>
    char.gender === 'Kvinne' ? '/character_images/default_female_avatar.jpg' : '/character_images/default_male_avatar.jpg';

// Deterministic number in [0, 1) from a string, so everyone gets the same "random" value per day
export const seededRandom = (seed: string): number => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    // Final mix (MurmurHash3 fmix32) so seeds differing by one character give very different values
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
};

export const fireWinConfetti = (halloween: boolean) => {
    if (halloween) {
        const shapes = ['🎃', '👻', '🦇'].map(text => confetti.shapeFromText({ text, scalar: 2 }));
        confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 }, shapes, scalar: 2 });
    } else {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    }
};
