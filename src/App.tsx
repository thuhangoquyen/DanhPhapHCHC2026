import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CompoundDetail from "./pages/CompoundDetail";

function App() {
  return (
    <Router>
      <Routes>
        {/* Đường dẫn trang chủ (Flashcard, Quiz, Tra cứu, Hướng dẫn) */}
        <Route path="/" element={<HomePage />} />

        {/* Đường dẫn chuyển sang trang Chi tiết 3D của từng chất */}
        <Route path="/compound/:id" element={<CompoundDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
