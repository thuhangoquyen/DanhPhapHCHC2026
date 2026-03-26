import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
// Tạm thời tắt index.css và service worker để ép nó chạy

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
