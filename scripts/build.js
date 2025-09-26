#!/usr/bin/env node
const esbuild = require('esbuild');

(async () => {
  const watch = process.argv.includes('--watch');
  const buildOptions = {
    entryPoints: ['src/extension.ts'],
    outdir: 'dist',
    bundle: true,
    platform: 'node',
    external: ['vscode'],
    sourcemap: true,
    target: 'node18',
    format: 'cjs'
  };

  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    console.log('Build complete');
  }
})();
