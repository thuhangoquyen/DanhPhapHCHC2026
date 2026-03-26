import React, { useEffect, useRef } from "react";

const Molecular3DViewer = ({ cid }) => {
  const viewerRef = useRef(null);

  useEffect(() => {
    // Kiểm tra nếu thư viện đã được load
    if (window.$3Dmol && viewerRef.current) {
      const viewer = window.$3Dmol.createViewer(viewerRef.current, {
        backgroundColor: "white",
      });

      // Lấy dữ liệu cấu trúc từ PubChem dựa trên CID (ID của chất)
      // Ví dụ: Ethanol có CID là 702
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF/?record_type=3d`;

      fetch(url)
        .then((res) => res.text())
        .then((data) => {
          viewer.addModel(data, "sdf"); // Thêm mô hình vào viewer
          viewer.setStyle({}, { stick: {}, sphere: { scale: 0.3 } }); // Định dạng: Que và Quả cầu
          viewer.zoomTo(); // Tự động căn chỉnh khung hình
          viewer.render(); // Vẽ mô hình
        })
        .catch((err) => console.error("Không thể tải mô hình 3D", err));
    }
  }, [cid]);

  return (
    <div
      style={{
        width: "100%",
        height: "400px",
        position: "relative",
        border: "1px solid #ddd",
      }}
    >
      <div ref={viewerRef} style={{ width: "100%", height: "100%" }}></div>
      <p style={{ textAlign: "center", fontSize: "12px" }}>
        Dùng chuột để xoay mô hình 3D
      </p>
    </div>
  );
};

export default Molecular3DViewer;
