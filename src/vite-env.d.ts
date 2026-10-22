/// <reference types="vite/client" />

declare module 'virtual:character-images' {
    /** File names (e.g. "per.jpg") in public/character_images, generated at build time */
    const files: string[];
    export default files;
}
