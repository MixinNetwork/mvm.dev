import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';
import Components from 'unplugin-vue-components/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  return mode === 'production'
    ? {
        plugins: [
          vue(),
          vueDevTools(),
          tailwindcss(),
          Components({
            resolvers: [NaiveUiResolver()],
          }),
          nodePolyfills({
              // To exclude specific polyfills, add them to this list.
              exclude: [
                'fs', // Excludes the polyfill for `fs` and `node:fs`.
              ],
              // Whether to polyfill specific globals.
              globals: {
                Buffer: true, // can also be 'build', 'dev', or false
                global: true,
                process: true,
              },
              // Whether to polyfill `node:` protocol imports.
              protocolImports: true,
          }),
          // visualizer({ open: true }),
        ],
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
          },
        },
        build: {
          rollupOptions: {
            treeshake: true,
          },
          commonjsOptions: {
            transformMixedEsModules: true,
          },
        },
      }
    : {
        plugins: [
          vue(),
          vueDevTools(),
          tailwindcss(),
          Components({
            resolvers: [NaiveUiResolver()],
          }),
        ],
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            process: 'process/browser',
            stream: 'stream-browserify',
            zlib: 'browserify-zlib',
            util: 'util',
            buffer: 'Buffer',
          },
        },
        optimizeDeps: {
          esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
              global: 'globalThis',
            },
            // Enable esbuild polyfill plugins
            plugins: [
              NodeGlobalsPolyfillPlugin({
                process: true,
                buffer: true,
              }),
              NodeModulesPolyfillPlugin(),
            ],
          },
        },
        build: {
          rollupOptions: {
            plugins: [
              // Enable rollup polyfills plugin
              // used during production bundling
              rollupNodePolyFill(),
            ],
          },
          commonjsOptions: {
            transformMixedEsModules: true,
          },
        },
      };
});
