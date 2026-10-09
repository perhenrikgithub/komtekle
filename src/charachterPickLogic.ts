import { useState, useEffect } from 'react';
import { Character } from './types';
import characterData from './data/characters.json';
import { getImagePath, seededRandom } from './utils';
import { AVOID_N_LAST_CHARACTERS } from './gameConfig';

/** Current UTC date in YYYY-MM-DD */
export const getTodayDateKey = (): string => new Date().toISOString().slice(0, 10);

/** Returns past date keys (YYYY-MM-DD) relative to dateKey in UTC */
export function getPastDateKeys(dateKey: string, count: number): string[] {
    const [year, month, day] = dateKey.split('-').map(Number);
    const currentDate = new Date(Date.UTC(year, month - 1, day));
    const dates: string[] = [];

    for (let i = 1; i <= count; i++) {
        const past = new Date(currentDate);
        past.setUTCDate(past.getUTCDate() - i);
        dates.push(past.toISOString().slice(0, 10));
    }
    return dates;
}

/** Filter characters added on or before dateKey */
export function getEligibleCharacters(dateKey: string): Character[] {
    return (characterData as Character[]).filter((c) => c.dateAdded <= dateKey);
}

/** Pure deterministic pick for Classic mode on a single date */
function getClassicPickForDate(dateKey: string, excludedNames: Set<string>): Character | null {
    const valid = getEligibleCharacters(dateKey);
    if (valid.length === 0) return null;

    const pool = valid.filter((c) => !excludedNames.has(c.name));
    const finalPool = pool.length > 0 ? pool : valid;

    const rand = seededRandom(`classic-${dateKey}`);
    const index = Math.floor(rand * finalPool.length);
    return finalPool[index];
}

/** Picks the Classic daily character, avoiding the last N days */
export function getDailyClassicCharacter(dateKey: string): Character | null {
    const pastDates = getPastDateKeys(dateKey, AVOID_N_LAST_CHARACTERS);
    const recentNames = new Set<string>();

    for (const pastDate of pastDates) {
        const pastChar = getClassicPickForDate(pastDate, new Set());
        if (pastChar) recentNames.add(pastChar.name);
    }

    return getClassicPickForDate(dateKey, recentNames);
}

/** Returns ordered candidate list for Image mode */
export function getImageCandidates(dateKey: string, excludedNames: Set<string>): Character[] {
    const valid = getEligibleCharacters(dateKey);
    if (valid.length === 0) return [];

    const pool = valid.filter((c) => !excludedNames.has(c.name));
    const finalPool = pool.length > 0 ? pool : valid;

    const start = Math.floor(seededRandom(`bilde-v2-${dateKey}`) * finalPool.length);
    return finalPool.map((_, i) => finalPool[(start + i) % finalPool.length]);
}

/** Hook to find Image mode target (skipping broken images and avoiding recent repeats & today's classic target) */
export const useDailyImageTarget = (dateKey: string, excludeName?: string) => {
    const [target, setTarget] = useState<Character | null>(null);

    useEffect(() => {
        // 1. Collect past 10 days' Image picks
        const pastDates = getPastDateKeys(dateKey, AVOID_N_LAST_CHARACTERS);
        const excluded = new Set<string>();
        for (const pastDate of pastDates) {
            const candidates = getImageCandidates(pastDate, new Set());
            if (candidates[0]) excluded.add(candidates[0].name);
        }

        // 2. Avoid today's Classic character
        if (excludeName) excluded.add(excludeName);

        // 3. Get ordered candidates and test image loading
        const candidates = getImageCandidates(dateKey, excluded);
        let cancelled = false;

        const tryAttempt = (index: number) => {
            if (cancelled || index >= candidates.length) return;
            const candidate = candidates[index];
            const img = new Image();
            img.onload = () => {
                if (!cancelled) setTarget(candidate);
            };
            img.onerror = () => tryAttempt(index + 1);
            img.src = getImagePath(candidate.name);
        };

        tryAttempt(0);
        return () => {
            cancelled = true;
        };
    }, [dateKey, excludeName]);

    return target;
};

/** Reusable hook for synced localStorage guesses */
export function useDailyGuesses(storageKey: string) {
    const [guesses, setGuesses] = useState<Character[]>(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(guesses));
    }, [guesses, storageKey]);

    return [guesses, setGuesses] as const;
}