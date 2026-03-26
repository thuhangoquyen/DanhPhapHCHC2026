import { useParams, useNavigate } from "react-router-dom";
import { grade11Data } from "../data/grade11Data";
import { grade12Data } from "../data/grade12Data";

// Hàm hỗ trợ render công thức hoá học chỉ số dưới
const formatChemicalFormula = (formula: string) => {
  if (!formula) return "";
  return (
    <span style={{ fontFamily: "Arial, sans-serif" }}>
      {formula.split("").map((char, index) => {
        if (!isNaN(Number(char)) && char !== " ") {
          return (
            <sub key={index} style={{ fontSize: "0.75em", bottom: "-0.15em" }}>
              {char}
            </sub>
          );
        }
        return <span key={index}>{char}</span>;
      })}
    </span>
  );
};

function CompoundDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Gom dữ liệu để tìm chất
  const allCompounds = [...grade11Data, ...grade12Data];
  const compound = allCompounds.find((c) => c.id === id);

  if (!compound) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "50px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2>🥺 Không tìm thấy chất này!</h2>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3498db",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🔙 Quay lại trang chủ
        </button>
      </div>
    );
  }

  // TÍNH NĂNG ĐỌC TÊN CHẤT (Web Speech API)
  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Trình duyệt của bạn không hỗ trợ tính năng đọc giọng nói.");
    }
  };

  // URL mở thẳng ra trang MolView
  const externalMolViewUrl = `https://molview.org/?q=${encodeURIComponent(
    compound.nameIUPAC
  )}`;

  return (
    <div
      style={{
        padding: "12px",
        fontFamily: "'Inter', Arial, sans-serif",
        maxWidth: "500px",
        margin: "0 auto",
        backgroundColor: "#fdfdfd",
        minHeight: "100vh",
        paddingBottom: "40px",
        boxSizing: "border-box",
      }}
    >
      {/* THANH ĐIỀU HƯỚNG */}
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#34495e",
            padding: "5px",
            transition: "0.2s",
          }}
        >
          ⬅️
        </button>
        <h2
          style={{
            flex: 1,
            textAlign: "center",
            color: "#2c3e50",
            margin: 0,
            fontSize: "16px",
          }}
        >
          CHI TIẾT PHÂN TỬ
        </h2>
        <div style={{ width: "30px" }}></div>
      </div>

      {/* THÔNG TIN CƠ BẢN */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "15px",
          borderRadius: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          marginBottom: "15px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "#95a5a6",
            fontWeight: "bold",
            textTransform: "uppercase",
            marginBottom: "3px",
          }}
        >
          {compound.type}
        </div>

        <div
          style={{
            fontSize: "32px",
            color: "#e74c3c",
            fontWeight: "900",
            letterSpacing: "1px",
            marginBottom: "8px",
          }}
        >
          {formatChemicalFormula(compound.formula)}
        </div>

        <h1
          style={{ fontSize: "22px", color: "#2c3e50", margin: "0 0 12px 0" }}
        >
          {compound.nameIUPAC}
        </h1>

        {compound.commonName && (
          <div
            style={{
              backgroundColor: "#fff9e6",
              color: "#d35400",
              padding: "6px 12px",
              borderRadius: "8px",
              display: "inline-block",
              fontSize: "13px",
              fontWeight: "bold",
              border: "1px dashed #f1c40f",
              marginBottom: "15px",
            }}
          >
            Tên thường: {compound.commonName}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => handleSpeak(compound.nameIUPAC)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: "20px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(52, 152, 219, 0.2)",
              transition: "0.2s",
            }}
          >
            <span style={{ fontSize: "18px" }}>🔊</span> Nghe phát âm IUPAC
          </button>
        </div>
      </div>

      {/* KHUNG HIỂN THỊ MÔ HÌNH SẠCH SẼ VÀ NÚT LIÊN KẾT NGOÀI */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "15px",
          borderRadius: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          textAlign: "center",
        }}
      >
        {/* KHUNG CHỈ HIỆN ẢNH 2D */}
        <div
          style={{
            width: "100%",
            height: "300px",
            position: "relative",
            backgroundColor: "#f8f9fa",
            borderRadius: "15px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "15px",
            overflow: "hidden",
          }}
        >
          {compound.image2D ? (
            <img
              src={compound.image2D}
              alt={`2D Model of ${compound.nameIUPAC}`}
              style={{
                maxWidth: "90%",
                maxHeight: "90%",
                objectFit: "contain",
                mixBlendMode: "multiply",
              }}
            />
          ) : (
            <div
              style={{ color: "#bdc3c7", textAlign: "center", padding: "20px" }}
            >
              <span
                style={{
                  fontSize: "40px",
                  display: "block",
                  marginBottom: "10px",
                }}
              >
                🖼️
              </span>
              <span>Chưa có ảnh 2D</span>
            </div>
          )}
        </div>

        {/* NÚT BẤM DẪN SANG MOLVIEW (DÙNG THẺ <a> ĐỂ MỞ TAB MỚI) */}
        <a
          href={externalMolViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 25px",
            backgroundColor: "#2ecc71",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "15px",
            fontWeight: "bold",
            fontSize: "14px",
            transition: "0.2s",
            boxShadow: "0 4px 6px rgba(46, 204, 113, 0.2)",
          }}
        >
          <span>🌐</span> Xem mô hình 3D trên MolView
        </a>
      </div>
    </div>
  );
}

export default CompoundDetail;
