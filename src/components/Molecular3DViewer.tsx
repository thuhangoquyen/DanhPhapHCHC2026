interface Props {
  cid?: number;
  name?: string;
}

function Molecular3DViewer({ cid, name }: Props) {
  if (!cid) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffeaa7",
        }}
      >
        <h3 style={{ color: "#d63031", textAlign: "center", padding: "20px" }}>
          ⚠️ Chất này chưa được nhập mã CID.
        </h3>
      </div>
    );
  }

  // 1. LINK ẢNH 2D CHUẨN XÁC 100% TỪ MỸ (Luôn luôn hiện)
  const imageUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?record_type=2d&image_size=large`;

  // 2. ĐÃ SỬA LỖI: Dùng lệnh "?q=" để MolView tự động tìm kiếm bằng TÊN CHẤT thay vì mã số
  const molviewUrl = `https://molview.org/?q=${encodeURIComponent(name || "")}`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        padding: "20px",
      }}
    >
      {/* Hiển thị công thức 2D (Ảnh tĩnh) */}
      <img
        src={imageUrl}
        alt={`Công thức hóa học của ${name}`}
        style={{
          maxWidth: "100%",
          maxHeight: "260px",
          objectFit: "contain",
          marginBottom: "20px",
        }}
      />

      {/* Nút bấm sang trang 3D chuyên nghiệp */}
      <a
        href={molviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          textDecoration: "none",
          color: "#fff",
          backgroundColor: "#27ae60",
          padding: "12px 24px",
          borderRadius: "8px",
          fontWeight: "bold",
          fontSize: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 6px rgba(39, 174, 96, 0.3)",
          transition: "transform 0.2s",
        }}
      >
        <span>🌐</span> Bấm vào đây để xem mô hình 3D (MolView)
      </a>

      {/* Lời nhắc nhở sư phạm cho học sinh */}
      <p
        style={{
          marginTop: "15px",
          fontSize: "14px",
          color: "#e67e22",
          textAlign: "center",
          maxWidth: "90%",
          lineHeight: "1.5",
        }}
      >
        <b>💡 Mẹo nhỏ:</b> Khi trang MolView mở ra, hệ thống sẽ tự tìm kiếm
        chất. Nếu chưa thấy mô hình 3D hiện lên, các em hãy bấm nút{" "}
        <b>"2D to 3D"</b> trên thanh công cụ nhé!
      </p>
    </div>
  );
}

export default Molecular3DViewer;
