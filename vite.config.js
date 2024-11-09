import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig((opt) => {
  return {
    root: 'src',
    build: {
      outDir: '../dist',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/index.ts'),
          register: resolve(__dirname, 'src/register.ts'),
          prompt: resolve(__dirname, 'src/prompt.ts'),
          requester: resolve(__dirname, 'src/requester.ts'),
        },
        output: {
          entryFileNames: '[name].js',
        },
      },
    },
  }
})
