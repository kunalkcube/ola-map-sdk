import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

function ensureUseClientDirective(files: string[]): void {
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    if (!content.startsWith("'use client';")) {
      writeFileSync(file, `'use client';\n${content}`, 'utf8');
    }
  }
}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'maplibre/index': 'src/maplibre/index.ts',
    'next/index': 'src/next/index.ts',
    'react/index': 'src/react/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: true,
  minify: false,
  target: 'es2022',
  external: ['react', 'react-dom', 'maplibre-gl', 'next'],
  onSuccess: async () => {
    ensureUseClientDirective(['dist/react/index.js', 'dist/react/index.cjs']);
  },
});
