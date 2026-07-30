import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// root를 web/ 으로 두되, 레슨 markdown은 레포 루트에 있으므로 상위 접근을 허용한다.
// lessons/*/LESSON.md 를 수정하면 dev 서버가 HMR로 즉시 반영한다.
export default defineConfig({
  root: 'web',
  plugins: [react()],
  server: {
    port: 3010,
    strictPort: true,
    open: true,
    fs: { allow: ['..'] },
  },
  build: { outDir: '../dist', emptyOutDir: true },
})
