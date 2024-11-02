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
          register: resolve(__dirname, 'src/register.ts') 
        },
        output: {
          entryFileNames: '[name].js',
        },
      },
    },
  }
})
