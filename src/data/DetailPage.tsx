import Molecular3DViewer from "../components/Molecular3DViewer";
import { useParams, Link } from "react-router-dom";
import { grade12Data } from "../data/grade12Data";
import { grade11Data } from "../data/grade11Data";

function DetailPage() {
  const { id } = useParams();

  // Gom 2 kho dữ liệu lại để tìm kiếm xuyên suốt 11 và 12
  const allData = [...grade11Data, ...grade12Data];
  const compound = allData.find((c) => c.id === id);

  if (!compound) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Không tìm thấy chất này!</h2>
        <Link to="/">⬅ Quay lại danh sách</Link>
      </div>
    );
  }

  // --- TÍNH NĂNG 1: HÀM ĐỌC TÊN IUPAC (Yêu cầu số 6) ---
  const speakIUPAC = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.8; // Tốc độ đọc vừa phải để học sinh nghe rõ
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- TÍNH NĂNG 2: HÀM TỰ ĐỘNG HẠ CHỈ SỐ CÔNG THỨC (Ngữ pháp Hóa học) ---
  const formatFormula = (formula: string) => {
    return formula.split("").map((char, index) => {
      // Nếu là chữ số và không phải khoảng trắng, hạ thấp nó xuống
      if (!isNaN(Number(char)) && char !== " ") {
        return (
          <sub key={index} style={{ fontSize: "0.6em" }}>
            {char}
          </sub>
        );
      }
      return char;
    });
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        color: "#2c3e50",
      }}
    >
      <Link
        to="/"
        style={{ color: "#3498db", textDecoration: "none", fontWeight: "bold" }}
      >
        ⬅ Quay lại danh sách
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginTop: "20px",
        }}
      >
        <h1 style={{ color: "#e74c3c", margin: 0 }}>{compound.nameIUPAC}</h1>
        {/* Nút loa đọc tên */}
        <button
          onClick={() => speakIUPAC(compound.nameIUPAC)}
          style={{
            background: "#f1f2f6",
            border: "none",
            cursor: "pointer",
            fontSize: "24px",
            borderRadius: "50%",
            width: "45px",
            height: "45px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Nghe phát âm IUPAC"
        >
          🔊
        </button>
      </div>

      <hr style={{ border: "0.5px solid #eee", margin: "20px 0" }} />

      {/* --- TÍNH NĂNG 3: KHUNG HIỂN THỊ ẢNH 2D (Yêu cầu số 2) --- */}
      <div
        style={{
          textAlign: "center",
          margin: "20px 0",
          padding: "15px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #eee",
        }}
      >
        <h4
          style={{ color: "#7f8c8d", marginBottom: "10px", fontSize: "14px" }}
        >
          CẤU TẠO 2D
        </h4>
        {compound.image2D ? (
          <img
            src={compound.image2D}
            alt={`Cấu tạo 2D của ${compound.nameIUPAC}`}
            style={{
              maxHeight: "180px",
              maxWidth: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <div
            style={{
              padding: "20px",
              color: "#bdc3c7",
              border: "1px dashed #ccc",
              borderRadius: "8px",
            }}
          >
            Chưa cập nhật hình ảnh 2D
          </div>
        )}
      </div>

      {/* PHẦN THÔNG TIN CHỮ */}
      <div
        style={{
          fontSize: "18px",
          lineHeight: "1.8",
          backgroundColor: "#f9f9f9",
          padding: "20px",
          borderRadius: "12px",
        }}
      >
        <p>
          <b>Công thức phân tử:</b> {formatFormula(compound.formula)}
        </p>
        <p>
          <b>Tên thông thường:</b> {compound.commonName || "Không có"}
        </p>
        <p>
          <b>Loại hợp chất:</b>{" "}
          <span style={{ color: "#2980b9" }}>{compound.type}</span>
        </p>
        <p>
          <b>Thuộc phần:</b> {compound.chapter}
        </p>
      </div>

      {/* KHUNG HIỂN THỊ 3D (Tính năng cũ vẫn giữ nguyên) */}
      <div
        style={{
          marginTop: "30px",
          height: "400px",
          border: "2px solid #bdc3c7",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Molecular3DViewer cid={compound.cid} name={compound.nameIUPAC} />
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#e8f4f8",
          borderRadius: "8px",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0", color: "#2980b9" }}>
          📌 Chú giải màu sắc nguyên tử:
        </h4>
        <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
          <li>
            Xám / Đen: <b>Carbon (C)</b>
          </li>
          <li>
            Trắng: <b>Hydrogen (H)</b>
          </li>
          <li>
            Đỏ: <b>Oxygen (O)</b>
          </li>
          <li>
            Xanh dương: <b>Nitrogen (N)</b>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default DetailPage;
