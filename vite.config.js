import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

const IMAGE_DIR = path.resolve(import.meta.dirname, 'public/character_images');
const VIRTUAL_ID = 'virtual:character-images';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

// Exposes the list of files in public/character_images as `virtual:character-images`,
// so the daily picker knows (deterministically, for every player) which characters have an image.
const characterImages = () => ({
  name: 'character-images',
  resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
  load(id) {
    if (id !== RESOLVED_ID) return;
    const files = fs.readdirSync(IMAGE_DIR).filter((f) => f.endsWith('.jpg')).map((f) => f.normalize('NFC'));
    return `export default ${JSON.stringify(files)};`;
  },
  configureServer(server) {
    // Reload the list when images are added/removed during `npm run dev`
    server.watcher.add(IMAGE_DIR);
    const invalidate = (file) => {
      if (!file.startsWith(IMAGE_DIR)) return;
      const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
      if (mod) server.moduleGraph.invalidateModule(mod);
      server.ws.send({ type: 'full-reload' });
    };
    server.watcher.on('add', invalidate);
    server.watcher.on('unlink', invalidate);
  },
});

export default defineConfig({
  plugins: [characterImages()],
});
