export type FeatureType = 'EXACT' | 'PARTIAL' | 'RANKED';

export interface FeatureConfig {
    key: string;              // Matches the key in your JSON
    label: string;            // The display name for the column header
    type: FeatureType;        // How it should be compared
    rankOrder?: string[];     // Used for 'RANKED' (arrows) - ordered low to high
    widthClass: string;       // Tailwind width classes for consistent UI
    mobileSpanClass?: string; // Tailwind col-span class for the mobile card grid (8 columns, default col-span-2)
}

export interface ComparisonResult {
    color: 'green' | 'yellow' | 'red';
    arrow?: 'up' | 'down' | null;
    displayValue: string;
}

export interface Character {
    name: string;
    gender: string;
    role: string | string[];
    height: string;
    "certified mojavebabe"?: string;
    certified_mojavebabe?: string;
    "verv-whipped"?: string;
    verv_whipped?: string;
    region: string;
    profil: string;
    [key: string]: any; // Allows for arbitrary new keys in JSON
}