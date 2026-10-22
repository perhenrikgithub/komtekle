import { useState, useEffect } from 'react';
import { Character } from './types';
import characterData from './data/characters.json';
import characterImageFiles from 'virtual:character-images';
import { getImagePath, seededRandom } from './utils';
import { AVOID_N_LAST_CHARACTERS } from './gameConfig';

/**
 * From this date on, picks avoid what was ACTUALLY served on the previous N days (chained forward).
 * Days before it use the legacy algorithm, because that is what players were really shown.
 * Don't change this date: moving it changes past and current picks.
 */
export const PICK_HISTORY_START = '2026-10-23';

interface DailyPicks {
    classic: Character | null;
    image: Character | null;
}

const imageFiles = new Set(characterImageFiles.map((f) => f.normalize('NFC')));

/** True if public/character_images has a picture for this character (known at build time) */
export const hasImage = (c: Character): boolean =>
    imageFiles.has(getImagePath(c.name).split('/').pop()!.normalize('NFC'));

/** Current UTC date in YYYY-MM-DD */
export const getTodayDateKey = (): string => new Date().toISOString().slice(0, 10);

/** Date key shifted by `days` (UTC) */
export function addDays(dateKey: string, days: number): string {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Returns past date keys (YYYY-MM-DD) relative to dateKey in UTC, most recent first */
export function getPastDateKeys(dateKey: string, count: number): string[] {
    return Array.from({ length: count }, (_, i) => addDays(dateKey, -(i + 1)));
}

/** Filter characters added on or before dateKey */
export function getEligibleCharacters(dateKey: string): Character[] {
    return (characterData as Character[]).filter((c) => c.dateAdded <= dateKey);
}

/** Seeded pick from pool, skipping excluded names (falls back to the full pool if everything is excluded) */
function pickFromPool(pool: Character[], excludedNames: Set<string>, seed: string): Character | null {
    if (pool.length === 0) return null;
    const filtered = pool.filter((c) => !excludedNames.has(c.name));
    const finalPool = filtered.length > 0 ? filtered : pool;
    return finalPool[Math.floor(seededRandom(seed) * finalPool.length)];
}

// ---------------------------------------------------------------------------
// Legacy algorithm (dates before PICK_HISTORY_START). Kept only to reproduce what was served.
// It excluded the *unfiltered* picks of past days rather than the real ones, which caused repeats.
// ---------------------------------------------------------------------------

function legacyClassicPick(dateKey: string): Character | null {
    const recent = new Set<string>();
    for (const pastDate of getPastDateKeys(dateKey, AVOID_N_LAST_CHARACTERS)) {
        const c = pickFromPool(getEligibleCharacters(pastDate), new Set(), `classic-${pastDate}`);
        if (c) recent.add(c.name);
    }
    return pickFromPool(getEligibleCharacters(dateKey), recent, `classic-${dateKey}`);
}

function legacyImageCandidates(dateKey: string, excludedNames: Set<string>): Character[] {
    const valid = getEligibleCharacters(dateKey);
    if (valid.length === 0) return [];
    const pool = valid.filter((c) => !excludedNames.has(c.name));
    const finalPool = pool.length > 0 ? pool : valid;
    const start = Math.floor(seededRandom(`bilde-v2-${dateKey}`) * finalPool.length);
    return finalPool.map((_, i) => finalPool[(start + i) % finalPool.length]);
}

function legacyImagePick(dateKey: string, classic: Character | null): Character | null {
    const excluded = new Set<string>();
    for (const pastDate of getPastDateKeys(dateKey, AVOID_N_LAST_CHARACTERS)) {
        const first = legacyImageCandidates(pastDate, new Set())[0];
        if (first) excluded.add(first.name);
    }
    if (classic) excluded.add(classic.name);
    // The old code skipped candidates whose image failed to load at runtime
    return legacyImageCandidates(dateKey, excluded).find(hasImage) ?? null;
}

// ---------------------------------------------------------------------------
// Current algorithm
// ---------------------------------------------------------------------------

const picksCache = new Map<string, DailyPicks>();

function computePicks(dateKey: string): DailyPicks {
    if (dateKey < PICK_HISTORY_START) {
        const classic = legacyClassicPick(dateKey);
        return { classic, image: legacyImagePick(dateKey, classic) };
    }

    const recent = getPastDateKeys(dateKey, AVOID_N_LAST_CHARACTERS).map(getPicksForDate);
    const eligible = getEligibleCharacters(dateKey);

    const recentClassic = new Set(recent.flatMap((p) => (p.classic ? [p.classic.name] : [])));
    const classic = pickFromPool(eligible, recentClassic, `classic-${dateKey}`);

    // Image mode: only characters with a picture, never the same as today's classic target
    const recentImage = new Set(recent.flatMap((p) => (p.image ? [p.image.name] : [])));
    if (classic) recentImage.add(classic.name);
    const image = pickFromPool(eligible.filter(hasImage), recentImage, `bilde-v2-${dateKey}`);

    return { classic, image };
}

/** The real classic + image targets for a date (deterministic, memoized) */
export function getPicksForDate(dateKey: string): DailyPicks {
    const cached = picksCache.get(dateKey);
    if (cached) return cached;

    // Fill history forward first so computePicks only ever looks up cached days (no deep recursion)
    if (dateKey > PICK_HISTORY_START) {
        for (let d = PICK_HISTORY_START; d < dateKey; d = addDays(d, 1)) {
            if (!picksCache.has(d)) picksCache.set(d, computePicks(d));
        }
    }

    const picks = computePicks(dateKey);
    picksCache.set(dateKey, picks);
    return picks;
}

/** Classic daily character */
export const getDailyClassicCharacter = (dateKey: string): Character | null => getPicksForDate(dateKey).classic;

/** Image mode daily character */
export const getDailyImageCharacter = (dateKey: string): Character | null => getPicksForDate(dateKey).image;

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
