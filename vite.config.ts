import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Thêm dòng này nếu dùng React
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(), // Đảm bảo có plugin react để hỗ trợ file .tsx
    VitePWA({
      registerType: "autoUpdate", // Đổi 'prompt' thành 'autoUpdate' để tự động cập nhật Offline mượt mà hơn
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,jpg,ico,txt}"], // Bổ sung ico, txt
        cleanupOutdatedCaches: true, // Tự dọn dẹp bộ nhớ cũ để app không bị nặng
        runtimeCaching: [
          {
            // Cấu hình quan trọng: Giúp app vẫn chạy ngay cả khi server gặp sự cố hoặc mất mạng hoàn toàn
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst", // Ưu tiên mạng, nhưng nếu mất mạng thì lấy trong máy ra dùng
            options: {
              cacheName: "html-cache",
            },
          },
        ],
      },
      manifest: {
        name: "Danh Pháp Hợp chất Hữu Cơ",
        short_name: "Danh Pháp HCHC",
        description: "Ứng dụng học danh pháp hóa học hữu cơ",
        theme_color: "#0099FF", // Màu chủ đạo (Indigo) nhìn chuyên nghiệp hơn
        background_color: "#ffffff",
        display: "standalone", // Quan trọng: Để khi mở app nó mất thanh địa chỉ trình duyệt, nhìn giống App thật
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable", // Thêm dòng này để icon đẹp trên mọi loại điện thoại
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
