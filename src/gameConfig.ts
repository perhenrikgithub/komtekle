import { FeatureConfig } from './types';

// The number of most recent characters to avoid when selecting a new daily character
export const AVOID_N_LAST_CHARACTERS = 7;

// For context: the image has a width of 24 (tailwind w-24)

export const GAME_FEATURES: FeatureConfig[] = [
    {
        key: 'gender',
        label: 'Antatt kjønn',
        type: 'EXACT',
        widthClass: 'w-24'
    },
    {
        key: 'role',
        label: 'Type',
        type: 'PARTIAL',
        // widthClass: 'flex-1 min-w-[100px]'
        widthClass: 'w-32',
        mobileSpanClass: 'col-span-3'
    },
    {
        key: 'height',
        label: 'Høyde',
        type: 'RANKED',
        rankOrder: [
            'Lommeformat',
            'Litt kortere enn menneskehøyde',
            'Menneskehøyde',
            'Langbeint',
            'Takhøyde',
            'Tårnhøyde'
        ],
        widthClass: 'w-32',
        mobileSpanClass: 'col-span-3'
    },
    {
        key: 'certified mojavebabe',
        label: 'Certified mojavebabe',
        type: 'EXACT',
        widthClass: 'w-24'
    },
    {
        key: 'verv-whipped',
        label: 'Verv-whipped',
        type: 'EXACT',
        widthClass: 'w-24'
    },
    {
        key: 'region',
        label: 'Region',
        type: 'EXACT',
        widthClass: 'w-24'
    },
    {
        key: 'profil',
        label: 'Profil',
        type: 'EXACT',
        widthClass: 'w-24'
    }
];