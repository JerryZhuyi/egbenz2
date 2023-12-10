import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'

// https://vitejs.dev/config/
const __dirname = path.dirname('.');

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve:{
    alias: {
      '@lib': path.resolve(__dirname, 'lib'),
    }
  }
})
