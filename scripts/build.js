#!/usr/bin/env node
const esbuild = require('esbuild');

(async () => {
  const watch = process.argv.includes('--watch');
  const builds = [
    {
      entryPoints: ['src/extension.ts'],
      outdir: 'dist',
      bundle: true,
      platform: 'node',
      external: ['vscode'],
      sourcemap: true,
      target: 'node18',
      format: 'cjs'
    },
    {
      entryPoints: ['src/mcp/server.ts'],
      outdir: 'dist/mcp',
      bundle: true,
      platform: 'node',
      external: [],
      sourcemap: true,
      target: 'node18',
      format: 'cjs'
    },
    {
      entryPoints: ['src/mcp/client.ts', 'src/mcp/tools.ts'],
      outdir: 'dist/mcp',
      bundle: true,
      platform: 'node',
      external: [],
      sourcemap: true,
      target: 'node18',
      format: 'cjs'
    }
  ];

  if (watch) {
    const ctx = await esbuild.context({
      plugins: [],
      metafile: false,
      write: true,
      logLevel: 'info',
      // esbuild context API supports single config; emulate by rebuilding both on rebuild
    });
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    for (const opts of builds) {
      await esbuild.build(opts);
    }
    console.log('Build complete');
  }
})();
