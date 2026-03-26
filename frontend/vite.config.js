import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Docker環境で外部アクセスを許可
    port: 3000,
    watch: {
      usePolling: true, // Dockerでファイル監視を有効化
      interval: 1000, // ポーリング間隔（ミリ秒）
    },
    proxy: {
      "/api": {
        target: "http://backend:8000", // docker-composeのサービス名
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
