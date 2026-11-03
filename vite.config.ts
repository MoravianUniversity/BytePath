import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '',
  build: {
    target: 'es2024',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|scheduler)([\\/]|$)/,
              priority: 40,
            },
            {
              name: 'markdown-vendor',
              test: /node_modules[\\/](react-markdown|remark-gfm|remark-parse|remark-rehype|rehype-.*|mdast-.*|hast-.*|unist-.*|unified|micromark.*)([\\/]|$)/,
              priority: 30,
            },
            {
              name: 'fontawesome-vendor',
              test: /node_modules[\\/]@fortawesome([\\/]|$)/,
              priority: 30,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 10,
            },
          ],
        },
      },
    },
  }  
})
