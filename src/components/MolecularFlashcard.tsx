import { useState, useEffect } from "react";

interface Props {
  compound: any;
  mode?: "f2n" | "n2f";
  onFlipStateChange?: (isAnimating: boolean) => void;
}

function MolecularFlashcard({
  compound,
  mode = "f2n",
  onFlipStateChange,
}: Props) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
    setImgError(false);
    setIsAnimating(false);
    if (onFlipStateChange) onFlipStateChange(false);
  }, [compound.id, mode]);

  const isFormulaToName = mode === "f2n";

  const handleCardClick = () => {
    if (isAnimating) return;

    setIsFlipped(!isFlipped);
    setIsAnimating(true);
    if (onFlipStateChange) onFlipStateChange(true);

    setTimeout(() => {
      setIsAnimating(false);
      if (onFlipStateChange) onFlipStateChange(false);
    }, 600);
  };

  const formatFormula = (formula: string) => {
    if (!formula) return "";
    return (
      <span style={{ fontFamily: "Arial, sans-serif" }}>
        {formula.split("").map((char, index) => {
          const isNumber = !isNaN(Number(char)) && char !== " ";
          const isPolymerN =
            char === "n" &&
            index > 0 &&
            (formula[index - 1] === ")" || formula[index - 1] === "]");

          if (isNumber || isPolymerN) {
            return (
              <sub
                key={index}
                style={{
                  fontSize: "0.65em",
                  verticalAlign: "sub",
                  position: "relative",
                  bottom: "-0.1em",
                }}
              >
                {char}
              </sub>
            );
          }
          return <span key={index}>{char}</span>;
        })}
      </span>
    );
  };

  // NỘI DUNG CÔNG THỨC
  const FormulaContent = (color: string) => {
    const formulaLen = compound.formula ? compound.formula.length : 0;

    let fSize = "28px";
    if (formulaLen > 24) fSize = "13px";
    else if (formulaLen > 18) fSize = "16px";
    else if (formulaLen > 14) fSize = "20px";
    else if (formulaLen > 10) fSize = "24px";

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "0 10px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {compound.image2D && !imgError ? (
          <img
            src={compound.image2D}
            alt="Cấu tạo 2D"
            onError={() => setImgError(true)}
            style={{
              maxWidth: "95%",
              // ĐÃ CẬP NHẬT: Cho phép ảnh cao tối đa 120px (trước đây là 90px)
              maxHeight: "120px",
              objectFit: "contain",
              filter: color === "#fff" ? "brightness(0) invert(1)" : "none",
            }}
          />
        ) : (
          <div
            style={{
              fontSize: fSize,
              fontWeight: "800",
              color: color,
              letterSpacing: "1px",
              whiteSpace: "nowrap",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {formatFormula(compound.formula)}
          </div>
        )}
      </div>
    );
  };

  // TÊN GỌI
  const NameContent = (color: string) => (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: "0 10px",
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          margin: "0 0 10px 0",
          fontSize: "18px",
          fontWeight: "800",
          textAlign: "center",
          padding: "0 5px",
          lineHeight: "1.2",
          color: color,
          wordWrap: "break-word",
          wordBreak: "break-word",
          maxWidth: "100%",
        }}
      >
        {compound.nameIUPAC}
      </h3>
      {compound.commonName && (
        <div
          style={{
            backgroundColor: "rgba(120, 120, 120, 0.15)",
            padding: "6px 12px",
            borderRadius: "8px",
            width: "90%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "9px",
              opacity: 0.9,
              marginBottom: "2px",
              textTransform: "uppercase",
              fontWeight: "600",
              color: color,
            }}
          >
            Tên thường / Khác
          </span>
          <span
            style={{
              color: color === "#fff" ? "#FACC15" : "#e67e22",
              fontSize: "14px",
              fontWeight: "800",
              textAlign: "center",
              wordWrap: "break-word",
              wordBreak: "break-word",
              maxWidth: "100%",
            }}
          >
            {compound.commonName}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div
      onClick={handleCardClick}
      style={{
        width: "100%",
        maxWidth: "320px",
        // ĐÃ CẬP NHẬT: Tăng chiều cao tổng thể của thẻ lên 240px (trước đây là 200px)
        height: "240px",
        perspective: "1000px",
        cursor: isAnimating ? "wait" : "pointer",
        margin: "0 auto",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          textAlign: "center",
          transition: "transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)",
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* MẶT TRƯỚC */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backfaceVisibility: "hidden",
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "15px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#F3F5F9",
              color: "#8A95A5",
              padding: "5px 10px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            {compound.chapter || "Chủ đề"}
          </div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "800",
              color: "#9FA9BC",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginTop: "12px",
              marginBottom: "8px",
            }}
          >
            {isFormulaToName ? "Công thức" : "Tên gọi"}
          </div>

          {isFormulaToName ? FormulaContent("#1E293B") : NameContent("#1E293B")}

          <div
            style={{
              backgroundColor: "#EEF2FF",
              color: "#6084FF",
              padding: "6px 16px",
              borderRadius: "15px",
              fontSize: "11px",
              fontWeight: "700",
              marginTop: "auto",
            }}
          >
            Chạm để lật
          </div>
        </div>

        {/* MẶT SAU */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backfaceVisibility: "hidden",
            background: "linear-gradient(135deg, #3B5BDB 0%, #2A48C4 100%)",
            color: "white",
            borderRadius: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: "rotateY(180deg)",
            padding: "15px",
            boxSizing: "border-box",
            boxShadow: "0 6px 16px rgba(59, 91, 219, 0.3)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "rgba(255,255,255,0.9)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "8px",
              marginTop: "5px",
            }}
          >
            {isFormulaToName ? "Tên IUPAC" : "Công thức"}
          </div>

          {isFormulaToName ? NameContent("#fff") : FormulaContent("#fff")}

          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.25)",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: "600",
              marginTop: "auto",
            }}
          >
            Loại: {compound.type}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MolecularFlashcard;
