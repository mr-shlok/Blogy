import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
const viteConfig = {
  plugins: [react()],
}

export default defineConfig(() =>
  //   lingoCompiler.vite({
  //     models: "lingo.dev"
  //   })(viteConfig)
  viteConfig
)
