import { useState, useEffect } from "react";
import { grade12Data } from "../data/grade12Data";
import { grade11Data } from "../data/grade11Data";
import MolecularFlashcard from "../components/MolecularFlashcard";
import { Link } from "react-router-dom";

// Định nghĩa kiểu dữ liệu cho Bảng xếp hạng
interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

// HÀM LẤY TÊN AN TOÀN: Chống lỗi khi data bị thiếu nameIUPAC
const getCompoundName = (compound: any) => {
  if (!compound) return "";
  return compound.nameIUPAC || compound.name || compound.commonName || "⚠️ Thiếu dữ liệu tên";
};

// Hàm hỗ trợ render công thức hoá học chỉ số dưới
const formatChemicalFormula = (formula: string) => {
  if (!formula) return "";
  return (
    <span style={{ fontFamily: "Arial, sans-serif" }}>
      {formula.split("").map((char, index) => {
        if (!isNaN(Number(char)) && char !== " ") {
          return (
            <sub key={index} style={{ fontSize: "0.7em", bottom: "-0.15em" }}>
              {char}
            </sub>
          );
        }
        return <span key={index}>{char}</span>;
      })}
    </span>
  );
};

// COMPONENT XỬ LÝ THÔNG MINH: CHỈ HIỆN ẢNH HOẶC CHỮ
const FormulaDisplay = ({
  compound,
  isOption = false,
}: {
  compound: any;
  isOption?: boolean;
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [compound.id]);

  if (compound.image2D && !imgFailed) {
    return (
      <img
        src={compound.image2D}
        alt="2D Formula"
        onError={() => setImgFailed(true)}
        style={
          isOption
            ? {
                maxHeight: "45px",
                maxWidth: "200px",
                objectFit: "contain",
                mixBlendMode: "multiply",
              }
            : {
                maxHeight: "90px",
                maxWidth: "100%",
                objectFit: "contain",
                mixBlendMode: "multiply",
              }
        }
      />
    );
  }

  return (
    <span
      style={
        isOption
          ? {}
          : {
              fontSize: "26px",
              color: "#e74c3c",
              fontWeight: "900",
              letterSpacing: "1px",
              display: "block",
            }
      }
    >
      {formatChemicalFormula(compound.formula)}
    </span>
  );
};

function HomePage() {
  const [activeTab, setActiveTab] = useState("learning");
  const [activeGrade, setActiveGrade] = useState("12");
  const [selectedChapter, setSelectedChapter] = useState("Tất cả");

  // STATE: HỌC TẬP & TRA CỨU
  const [learningMode, setLearningMode] = useState<"f2n" | "n2f">("f2n");
  const [learningQueue, setLearningQueue] = useState<any[]>([]);
  const [actionCount, setActionCount] = useState(0);
  const [isActionLocked, setIsActionLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // STATE: KIỂM TRA CHUNG
  const [quizStatus, setQuizStatus] = useState<"idle" | "playing_time" | "playing_scramble" | "finished">("idle");
  const [gameType, setGameType] = useState<"time" | "scramble">("time");
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentQuizScope, setCurrentQuizScope] = useState<"11" | "12" | "all" | null>(null);
  
  // Tùy chọn chủ đề cho bài thi Lớp 11 và Lớp 12
  const [quizChapter11, setQuizChapter11] = useState("Tất cả");
  const [quizChapter12, setQuizChapter12] = useState("Tất cả");

  // STATE: GAME ĐẤU TRƯỜNG 60S
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [combo, setCombo] = useState(0);

  // STATE: GAME ĐUỔI HÌNH BẮT CHỮ (SCRAMBLE)
  const [scrambleTarget, setScrambleTarget] = useState<any>(null);
  const [scrambleLetters, setScrambleLetters] = useState<any[]>([]);
  const [scrambleSlots, setScrambleSlots] = useState<any[]>([]);
  const [scrambleQuestions, setScrambleQuestions] = useState<any[]>([]);
  const [scrambleQIndex, setScrambleQIndex] = useState(0);
  const [isScrambleWrong, setIsScrambleWrong] = useState(false);
  const [scrambleLives, setScrambleLives] = useState(3);

  // Gamification & Bảng Xếp Hạng
  const [highScore, setHighScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [isScoreSaved, setIsScoreSaved] = useState(false);

  const fullData = activeGrade === "12" ? grade12Data : grade11Data;
  const chapters = ["Tất cả", ...Array.from(new Set(fullData.map((item) => item.chapter)))];
  const chapters11 = ["Tất cả", ...Array.from(new Set(grade11Data.map((item) => item.chapter)))];
  const chapters12 = ["Tất cả", ...Array.from(new Set(grade12Data.map((item) => item.chapter)))];
  const allCompounds = [...grade11Data, ...grade12Data];

  useEffect(() => {
    const savedHighScore = localStorage.getItem("chemQuizHighScore");
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));
    const savedLeaderboard = localStorage.getItem("chemQuizLeaderboard");
    if (savedLeaderboard) setLeaderboard(JSON.parse(savedLeaderboard));
  }, []);

  useEffect(() => {
    if (quizStatus === "finished" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("chemQuizHighScore", score.toString());
    }
  }, [quizStatus, score, highScore]);

  // Bộ đếm ngược cho Đấu trường 60s
  useEffect(() => {
    let timer: any;
    if (quizStatus === "playing_time" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft <= 0 && quizStatus === "playing_time") {
      setQuizStatus("finished");
    }
    return () => clearInterval(timer);
  }, [quizStatus, timeLeft]);

  // Check đáp án Đuổi hình bắt chữ
  useEffect(() => {
    if (quizStatus === "playing_scramble" && scrambleSlots.length > 0) {
        const isComplete = scrambleSlots.every(s => s.currentChar !== null);
        if (isComplete) {
            const currentStr = scrambleSlots.map(s => s.currentChar).join('');
            const expectedStr = scrambleSlots.map(s => s.expectedChar).join('');
            
            if (currentStr === expectedStr) {
                // Đúng
                setScore(prev => prev + 150);
                setCorrectCount(prev => prev + 1);
                setTimeout(() => {
                    if (scrambleQIndex < scrambleQuestions.length - 1) {
                        const nextIdx = scrambleQIndex + 1;
                        setScrambleQIndex(nextIdx);
                        setupScrambleQuestion(scrambleQuestions[nextIdx]);
                    } else {
                        setQuizStatus("finished"); // Hoàn thành tất cả
                    }
                }, 800);
            } else {
                // Sai
                setIsScrambleWrong(true);
                setScrambleLives(prev => {
                    const newLives = prev - 1;
                    if (newLives <= 0) {
                        setTimeout(() => setQuizStatus("finished"), 800); // Hết mạng
                    }
                    return newLives;
                });
            }
        }
    }
  }, [scrambleSlots]);

  useEffect(() => {
    const dataToLearn = selectedChapter === "Tất cả" ? fullData : fullData.filter((item) => item.chapter === selectedChapter);
    setLearningQueue([...dataToLearn]);
    setQuizStatus("idle");
  }, [activeGrade, selectedChapter, fullData]);

  const handleGotIt = () => {
    if (isActionLocked) return;
    setLearningQueue((prevQueue) => {
      const newQueue = [...prevQueue];
      newQueue.shift();
      return newQueue;
    });
    setActionCount((prev) => prev + 1);
  };

  const handleNeedReview = () => {
    if (isActionLocked) return;
    setLearningQueue((prevQueue) => {
      const newQueue = [...prevQueue];
      const currentCard = newQueue.shift();
      if (currentCard) newQueue.push(currentCard);
      return newQueue;
    });
    setActionCount((prev) => prev + 1);
  };

  const handleRestartLearning = () => {
    const dataToLearn = selectedChapter === "Tất cả" ? fullData : fullData.filter((item) => item.chapter === selectedChapter);
    setLearningQueue([...dataToLearn]);
    setActionCount(0);
  };

  const setupScrambleQuestion = (compound: any) => {
      setScrambleTarget(compound);
      const safeName = getCompoundName(compound);
      const name = safeName.toUpperCase();
      
      const slots = name.split('').map((char: string, index: number) => {
          const isSymbol = char === '-' || char === ',' || char === ' ' || !/[A-Z0-9]/.test(char);
          return {
              id: `slot-${index}`,
              expectedChar: char,
              currentChar: isSymbol ? char : null,
              sourceId: null,
              isSymbol: isSymbol
          };
      });
      setScrambleSlots(slots);

      const chars = name.split('').filter((c: string) => /[A-Z0-9]/.test(c));
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for(let i=0; i<3; i++) {
          chars.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
      }

      const letters = chars.map((c: string, i: number) => ({
          id: `letter-${i}`,
          char: c,
          used: false
      }));
      letters.sort(() => Math.random() - 0.5);
      setScrambleLetters(letters);
      setIsScrambleWrong(false);
  };

  const startQuiz = (scope: "11" | "12" | "all") => {
    if (!playerName.trim()) {
      alert("⚠️ Các em vui lòng nhập Họ tên và Lớp trước khi bắt đầu thi nhé!");
      return;
    }

    setCurrentQuizScope(scope);

    let dataToQuiz: any[] = [];
    if (scope === "11") {
      dataToQuiz = quizChapter11 === "Tất cả" ? [...grade11Data] : grade11Data.filter(item => item.chapter === quizChapter11);
    } else if (scope === "12") {
      dataToQuiz = quizChapter12 === "Tất cả" ? [...grade12Data] : grade12Data.filter(item => item.chapter === quizChapter12);
    } else if (scope === "all") {
      dataToQuiz = [...grade11Data, ...grade12Data];
    }

    if (dataToQuiz.length < 4) {
      alert("Chủ đề này cần ít nhất 4 chất để bắt đầu! Vui lòng chọn chủ đề khác.");
      return;
    }

    setScore(0);
    setCorrectCount(0);
    setIsScoreSaved(false);

    if (gameType === "time") {
      const generatedQuestions = Array.from({ length: 100 }).map(() => {
        const correctItem = dataToQuiz[Math.floor(Math.random() * dataToQuiz.length)];
        const wrongOptions = dataToQuiz.filter((item) => item.id !== correctItem.id).sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [correctItem, ...wrongOptions].sort(() => 0.5 - Math.random());
        const questionType = Math.random() > 0.5 ? "name2formula" : "formula2name";
        return { correctItem, options, questionType };
      });
      setQuizQuestions(generatedQuestions);
      setCurrentQIndex(0);
      setCombo(0);
      setTimeLeft(60);
      setSelectedAnswer(null);
      setQuizStatus("playing_time");
    } else {
      const shuffledData = [...dataToQuiz].sort(() => 0.5 - Math.random()).slice(0, 10);
      setScrambleQuestions(shuffledData);
      setScrambleQIndex(0);
      setScrambleLives(3);
      setupScrambleQuestion(shuffledData[0]);
      setQuizStatus("playing_scramble");
    }
  };

  const handleTimeAttackAnswer = (optionId: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(optionId);
    const isCorrect = optionId === quizQuestions[currentQIndex].correctItem.id;
    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setCorrectCount((prev) => prev + 1);
      let multiplier = 1;
      if (newCombo >= 6) multiplier = 3;
      else if (newCombo >= 3) multiplier = 2;
      setScore((prev) => prev + 100 * multiplier);
    } else {
      setCombo(0);
      setTimeLeft((prev) => Math.max(0, prev - 2));
    }
    setTimeout(() => {
      if (currentQIndex < quizQuestions.length - 1) {
        setCurrentQIndex((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        setQuizStatus("finished");
      }
    }, 400);
  };

  const handleScrambleLetterClick = (letter: any) => {
    if (letter.used) return;
    const emptyIndex = scrambleSlots.findIndex((s: any) => !s.isSymbol && s.currentChar === null);
    if (emptyIndex !== -1) {
        const newSlots = [...scrambleSlots];
        newSlots[emptyIndex].currentChar = letter.char;
        newSlots[emptyIndex].sourceId = letter.id;
        setScrambleSlots(newSlots);

        const newLetters = scrambleLetters.map((l: any) => l.id === letter.id ? {...l, used: true} : l);
        setScrambleLetters(newLetters);
        setIsScrambleWrong(false);
    }
  };

  const handleScrambleSlotClick = (index: number) => {
    const slot = scrambleSlots[index];
    if (slot.isSymbol || slot.currentChar === null) return;
    const newLetters = scrambleLetters.map((l: any) => l.id === slot.sourceId ? {...l, used: false} : l);
    setScrambleLetters(newLetters);
    const newSlots = [...scrambleSlots];
    newSlots[index].currentChar = null;
    newSlots[index].sourceId = null;
    setScrambleSlots(newSlots);
    setIsScrambleWrong(false);
  };

  const handleSaveToLeaderboard = () => {
    if (!playerName.trim() || isScoreSaved) return;
    const dateStr = new Date().toLocaleDateString("vi-VN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    const newEntry: LeaderboardEntry = { name: playerName.trim(), score: score, date: dateStr };
    const updatedLeaderboard = [...leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    setLeaderboard(updatedLeaderboard);
    localStorage.setItem("chemQuizLeaderboard", JSON.stringify(updatedLeaderboard));
    setIsScoreSaved(true);
  };

  const getRanking = () => {
    if (score >= 1500) return { title: "Thủ khoa Hoá Học", icon: "🎓", color: "#f1c40f", desc: "Giáo sư tương lai đây rồi! Xuất sắc!" };
    if (score >= 800) return { title: "Chiến thần Danh pháp", icon: "🌟", color: "#3498db", desc: "Phản xạ xuất thần! Rất đáng khen!" };
    if (score >= 300) return { title: "Tân binh Hữu cơ", icon: "🧪", color: "#e67e22", desc: "Mới khởi động thôi, làm lại để cháy hơn nhé!" };
    return { title: "Chúa tể mất gốc", icon: "📚", color: "#e74c3c", desc: "Đùa chút thôi! Hãy qua tab Học tập ôn lại nhé!" };
  };

  const searchResults = allCompounds.filter((compound) => {
    const query = searchQuery.toLowerCase();
    const safeName = getCompoundName(compound).toLowerCase();
    return (
      safeName.includes(query) ||
      (compound.formula && compound.formula.toLowerCase().includes(query)) ||
      (compound.commonName && compound.commonName.toLowerCase().includes(query))
    );
  });

  const renderTabs = () => (
    <div style={{ display: "flex", justifyContent: "space-around", backgroundColor: "#fff", padding: "12px 5px", borderRadius: "15px", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      {[
        { id: "learning", label: "Học tập", icon: "📚" },
        { id: "quiz", label: "Kiểm tra", icon: "🏆" },
        { id: "search", label: "Tra cứu", icon: "🔍" },
        { id: "guide", label: "Hướng dẫn", icon: "📖" },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id);
            setSelectedChapter("Tất cả");
            setSearchQuery("");
            setQuizStatus("idle");
          }}
          style={{
            flex: 1, border: "none", background: "none", display: "flex", flexDirection: "column",
            alignItems: "center", gap: "4px", color: activeTab === tab.id ? "#3498db" : "#95a5a6", cursor: "pointer", transition: "0.3s"
          }}
        >
          <span style={{ fontSize: "20px" }}>{tab.icon}</span>
          <span style={{ fontSize: "11px", fontWeight: "bold", color: activeTab === tab.id ? "#3498db" : "#95a5a6" }}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "15px", fontFamily: "'Inter', Arial, sans-serif", maxWidth: "500px", margin: "0 auto", backgroundColor: "#fdfdfd", minHeight: "100vh", paddingBottom: "40px" }}>
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "15px" }}>
        <img src="/logo-co-ha.png" alt="Logo Cô Hà" style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "50%", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }} />
        <h2 style={{ color: "#2c3e50", fontSize: "18px", margin: 0, lineHeight: "1.2", textAlign: "left" }}>DANH PHÁP HỢP CHẤT HỮU CƠ</h2>
      </div>

      {renderTabs()}

      {/* -------------------- TAB HỌC TẬP -------------------- */}
      {activeTab === "learning" && (
        <div style={{ animation: "fadeIn 0.3s" }}>
          {/* Menu Học Tập */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <button onClick={() => setActiveGrade("11")} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", backgroundColor: activeGrade === "11" ? "#3498db" : "#f1f2f6", color: activeGrade === "11" ? "white" : "#7f8c8d", fontWeight: "bold", cursor: "pointer" }}>Lớp 11</button>
            <button onClick={() => setActiveGrade("12")} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", backgroundColor: activeGrade === "12" ? "#e74c3c" : "#f1f2f6", color: activeGrade === "12" ? "white" : "#7f8c8d", fontWeight: "bold", cursor: "pointer" }}>Lớp 12</button>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <select value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)} style={{ width: "100%", minWidth: 0, padding: "12px", borderRadius: "10px", border: "1px solid #3498db", backgroundColor: "#f0f7ff", color: "#2c3e50", fontWeight: "bold", fontSize: "14px", outline: "none", textOverflow: "ellipsis" }}>
              {chapters.map((ch) => <option key={ch} value={ch}>{ch === "Tất cả" ? "🌟 Tất cả chủ đề" : `📂 ${ch}`}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", backgroundColor: "#ecf0f1", borderRadius: "12px", padding: "4px", marginBottom: "25px" }}>
            <button onClick={() => setLearningMode("f2n")} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: learningMode === "f2n" ? "#fff" : "transparent", color: learningMode === "f2n" ? "#3498db" : "#7f8c8d", fontWeight: "bold", boxShadow: learningMode === "f2n" ? "0 2px 5px rgba(0,0,0,0.1)" : "none", cursor: "pointer" }}>Công thức ➔ Tên</button>
            <button onClick={() => setLearningMode("n2f")} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: learningMode === "n2f" ? "#fff" : "transparent", color: learningMode === "n2f" ? "#3498db" : "#7f8c8d", fontWeight: "bold", boxShadow: learningMode === "n2f" ? "0 2px 5px rgba(0,0,0,0.1)" : "none", cursor: "pointer" }}>Tên ➔ Công thức</button>
          </div>
          {learningQueue.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <p style={{ fontSize: "13px", color: "#95a5a6", marginBottom: "15px" }}>Đang ôn tập: Thẻ {fullData.filter((i) => selectedChapter === "Tất cả" || i.chapter === selectedChapter).length - learningQueue.length + 1} / {fullData.filter((i) => selectedChapter === "Tất cả" || i.chapter === selectedChapter).length}</p>
              <div style={{ marginBottom: "25px", width: "100%", display: "flex", justifyContent: "center" }}>
                <MolecularFlashcard key={`${learningQueue[0].id}-${actionCount}`} compound={learningQueue[0]} mode={learningMode} onFlipStateChange={setIsActionLocked} />
              </div>
              <Link to={`/compound/${learningQueue[0].id}`} style={{ display: "inline-block", textDecoration: "none", color: "#3498db", fontSize: "13px", fontWeight: "bold", marginBottom: "25px", padding: "10px 20px", backgroundColor: "#e8f4f8", borderRadius: "20px", boxShadow: "0 2px 4px rgba(52, 152, 219, 0.1)" }}>🔍 Xem chi tiết 3D & Nghe đọc ➔</Link>
              <div style={{ display: "flex", gap: "15px", width: "100%", maxWidth: "300px" }}>
                <button onClick={handleNeedReview} disabled={isActionLocked} style={{ flex: 1, padding: "15px", borderRadius: "15px", border: "none", backgroundColor: "#fff", color: "#e74c3c", borderBottom: "4px solid #c0392b", fontWeight: "bold", fontSize: "15px", cursor: isActionLocked ? "not-allowed" : "pointer", opacity: isActionLocked ? 0.4 : 1, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>🔴 Chưa thuộc</button>
                <button onClick={handleGotIt} disabled={isActionLocked} style={{ flex: 1, padding: "15px", borderRadius: "15px", border: "none", backgroundColor: "#2ecc71", color: "#fff", borderBottom: "4px solid #27ae60", fontWeight: "bold", fontSize: "15px", cursor: isActionLocked ? "not-allowed" : "pointer", opacity: isActionLocked ? 0.4 : 1, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>🟢 Đã thuộc</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", backgroundColor: "#f0f9f4", borderRadius: "20px", border: "2px dashed #2ecc71" }}>
              <div style={{ fontSize: "50px", marginBottom: "10px" }}>🎉</div>
              <h3 style={{ color: "#27ae60" }}>Chúc mừng!</h3>
              <button onClick={handleRestartLearning} style={{ marginTop: "20px", padding: "12px 25px", backgroundColor: "#3498db", color: "#fff", border: "none", borderRadius: "25px", fontWeight: "bold", cursor: "pointer" }}>🔄 Ôn tập lại từ đầu</button>
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB KIỂM TRA -------------------- */}
      {activeTab === "quiz" && (
        <div style={{ animation: "fadeIn 0.3s" }}>
          
          {quizStatus === "idle" && (
            <div>
              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f0f7ff", borderRadius: "15px", border: "2px dashed #3498db" }}>
                <p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#2980b9", fontSize: "14px" }}>✍️ Nhập Họ Tên & Lớp trước khi thi:</p>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Nguyễn Văn A - 11A1" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)} 
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #bdc3c7", fontSize: "14px", outline: "none", boxSizing: "border-box" }} 
                />
              </div>

              <div style={{ display: "flex", backgroundColor: "#ecf0f1", borderRadius: "15px", padding: "5px", marginBottom: "25px" }}>
                <button onClick={() => setGameType("time")} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", backgroundColor: gameType === "time" ? "#fff" : "transparent", color: gameType === "time" ? "#e74c3c" : "#7f8c8d", fontWeight: "900", fontSize: "13px", boxShadow: gameType === "time" ? "0 4px 10px rgba(0,0,0,0.1)" : "none", cursor: "pointer", transition: "0.2s" }}>⏱️ ĐẤU TRƯỜNG 60S</button>
                <button onClick={() => setGameType("scramble")} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", backgroundColor: gameType === "scramble" ? "#fff" : "transparent", color: gameType === "scramble" ? "#8e44ad" : "#7f8c8d", fontWeight: "900", fontSize: "13px", boxShadow: gameType === "scramble" ? "0 4px 10px rgba(0,0,0,0.1)" : "none", cursor: "pointer", transition: "0.2s" }}>🧩 ĐUỔI HÌNH BẮT CHỮ</button>
              </div>

              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <p style={{ color: "#7f8c8d", fontSize: "13px", margin: 0 }}>
                  {gameType === "time" ? "Chọn phạm vi để bắt đầu chạy đua với thời gian!" : "Sắp xếp các chữ cái bị xáo trộn để tìm Tên đúng. Bạn có 3 Mạng!"}
                </p>
                <div style={{ marginTop: "10px", padding: "5px 15px", backgroundColor: "#fef9e7", border: "1px dashed #f1c40f", borderRadius: "15px", display: "inline-block" }}>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#d35400" }}>🏆 Kỷ lục cá nhân: {highScore} điểm</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ padding: "20px", backgroundColor: "#e8f4f8", border: "2px solid #3498db", borderRadius: "15px", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                    <span style={{ fontSize: "30px" }}>📘</span>
                    <div>
                      <div style={{ color: "#2980b9", fontWeight: "bold", fontSize: "16px" }}>Thử thách Lớp 11</div>
                      <div style={{ color: "#7f8c8d", fontSize: "12px", marginTop: "5px" }}>Tùy chọn chủ đề để luyện tập chuyên sâu</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                    <select value={quizChapter11} onChange={(e) => setQuizChapter11(e.target.value)} style={{ flex: 1, minWidth: 0, padding: "10px", borderRadius: "10px", border: "1px solid #bdc3c7", outline: "none", fontSize: "13px", color: "#2c3e50", fontWeight: "bold", textOverflow: "ellipsis" }}>
                      {chapters11.map((ch) => <option key={ch} value={ch}>{ch === "Tất cả" ? "🌟 Tất cả Lớp 11" : ch}</option>)}
                    </select>
                    <button onClick={() => startQuiz("11")} style={{ flexShrink: 0, padding: "10px 15px", backgroundColor: "#3498db", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}>BẮT ĐẦU</button>
                  </div>
                </div>

                <div style={{ padding: "20px", backgroundColor: "#fdedec", border: "2px solid #e74c3c", borderRadius: "15px", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                    <span style={{ fontSize: "30px" }}>📕</span>
                    <div>
                      <div style={{ color: "#c0392b", fontWeight: "bold", fontSize: "16px" }}>Thử thách Lớp 12</div>
                      <div style={{ color: "#7f8c8d", fontSize: "12px", marginTop: "5px" }}>Thiết lập giới hạn kiến thức bạn muốn thử</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                    <select value={quizChapter12} onChange={(e) => setQuizChapter12(e.target.value)} style={{ flex: 1, minWidth: 0, padding: "10px", borderRadius: "10px", border: "1px solid #bdc3c7", outline: "none", fontSize: "13px", color: "#2c3e50", fontWeight: "bold", textOverflow: "ellipsis" }}>
                      {chapters12.map((ch) => <option key={ch} value={ch}>{ch === "Tất cả" ? "🌟 Tất cả Lớp 12" : ch}</option>)}
                    </select>
                    <button onClick={() => startQuiz("12")} style={{ flexShrink: 0, padding: "10px 15px", backgroundColor: "#e74c3c", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}>BẮT ĐẦU</button>
                  </div>
                </div>

                <button onClick={() => startQuiz("all")} style={{ padding: "20px", backgroundColor: "#eefaf1", border: "2px solid #2ecc71", borderRadius: "15px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "15px", width: "100%" }}>
                  <span style={{ fontSize: "30px" }}>📚</span>
                  <div>
                    <div style={{ color: "#27ae60", fontWeight: "bold", fontSize: "16px" }}>Tổng hợp (11 & 12)</div>
                    <div style={{ color: "#7f8c8d", fontSize: "12px", marginTop: "5px" }}>Mở khóa toàn bộ dữ liệu, cực khó!</div>
                  </div>
                </button>
              </div>

              {leaderboard.length > 0 && (
                <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#fff", borderRadius: "20px", border: "2px solid #f1c40f", boxShadow: "0 8px 20px rgba(241, 196, 15, 0.15)" }}>
                  <h3 style={{ color: "#d35400", textAlign: "center", marginTop: 0, fontSize: "18px" }}>🏆 BẢNG VÀNG TOP 10 🏆</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {leaderboard.map((entry, idx) => {
                      let bgColors = ["#fff9e6", "#f8f9fa", "#fdf2e9"];
                      let borderColors = ["#f1c40f", "#bdc3c7", "#e67e22"];
                      let medalIcons = ["🥇", "🥈", "🥉"];
                      const isTop3 = idx < 3;
                      return (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: isTop3 ? bgColors[idx] : "#fff", borderRadius: "10px", borderBottom: `2px solid ${isTop3 ? borderColors[idx] : "#eee"}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "18px", width: "25px", textAlign: "center", fontWeight: "bold", color: "#7f8c8d" }}>{isTop3 ? medalIcons[idx] : `#${idx + 1}`}</span>
                            <span style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "15px" }}>{entry.name}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                            <span style={{ fontSize: "11px", color: "#95a5a6" }}>{entry.date}</span>
                            <span style={{ fontWeight: "900", color: "#e74c3c", fontSize: "15px" }}>{entry.score}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {quizStatus === "playing_time" && quizQuestions.length > 0 && (
            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ backgroundColor: timeLeft <= 10 ? "#e74c3c" : "#3498db", color: "#fff", padding: "5px 12px", borderRadius: "15px", fontSize: "16px", fontWeight: "900", boxShadow: timeLeft <= 10 ? "0 0 10px rgba(231, 76, 60, 0.5)" : "none", transition: "0.3s" }}>⏱ {timeLeft}s</span>
                  {combo >= 3 && <span style={{ color: "#e67e22", fontWeight: "bold", fontSize: "14px", animation: "pulse 0.5s infinite alternate" }}>🔥 x{combo >= 6 ? 3 : 2}</span>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#2ecc71", fontWeight: "900", fontSize: "20px" }}>{score}</div>
                  <div style={{ fontSize: "10px", color: "#95a5a6", textTransform: "uppercase", fontWeight: "bold" }}>Điểm số</div>
                </div>
              </div>

              <div style={{ textAlign: "center", marginBottom: "25px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "15px", border: "1px solid #e9ecef" }}>
                <p style={{ color: "#7f8c8d", fontSize: "13px", textTransform: "uppercase", fontWeight: "bold", marginBottom: "10px" }}>
                  {quizQuestions[currentQIndex].questionType === "name2formula" ? "Công thức của chất này là gì?" : "Tên gọi của chất này là gì?"}
                </p>
                {quizQuestions[currentQIndex].questionType === "name2formula" ? (
                  <h3 style={{ fontSize: "22px", color: "#2c3e50", margin: 0 }}>{getCompoundName(quizQuestions[currentQIndex].correctItem)}</h3>
                ) : (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80px" }}>
                    <FormulaDisplay compound={quizQuestions[currentQIndex].correctItem} isOption={false} />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {quizQuestions[currentQIndex].options.map((opt: any, index: number) => {
                  const isSelected = selectedAnswer === opt.id;
                  const isCorrectAnswer = opt.id === quizQuestions[currentQIndex].correctItem.id;
                  let bgColor = "#f1f2f6", textColor = "#2c3e50", borderColor = "transparent";
                  if (selectedAnswer) {
                    if (isCorrectAnswer) { bgColor = "#e8f8f5"; textColor = "#27ae60"; borderColor = "#2ecc71"; }
                    else if (isSelected && !isCorrectAnswer) { bgColor = "#fdedec"; textColor = "#c0392b"; borderColor = "#e74c3c"; }
                  }
                  return (
                    <button key={index} onClick={() => handleTimeAttackAnswer(opt.id)} disabled={!!selectedAnswer} style={{ display: "flex", alignItems: "center", width: "100%", padding: "15px", borderRadius: "12px", border: `2px solid ${borderColor}`, backgroundColor: bgColor, color: textColor, cursor: selectedAnswer ? "default" : "pointer", transition: "0.2s", textAlign: "left" }}>
                      <span style={{ backgroundColor: selectedAnswer ? isCorrectAnswer ? "#2ecc71" : isSelected ? "#e74c3c" : "#bdc3c7" : "#bdc3c7", color: "#fff", minWidth: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "bold", marginRight: "15px", fontSize: "13px" }}>{["A", "B", "C", "D"][index]}</span>
                      <span style={{ fontSize: "16px", fontWeight: "bold", display: "flex", alignItems: "center" }}>
                        {quizQuestions[currentQIndex].questionType === "name2formula" ? <FormulaDisplay compound={opt} isOption={true} /> : getCompoundName(opt)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {quizStatus === "playing_scramble" && scrambleTarget && (
            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "center" }}>
                  <div style={{ color: "#e74c3c", fontSize: "20px", fontWeight: "bold" }}>
                      {"❤️".repeat(scrambleLives)}{"🖤".repeat(3 - scrambleLives)}
                  </div>
                  <div style={{ color: "#8e44ad", fontSize: "24px", fontWeight: "900" }}>
                      {score}
                  </div>
              </div>

              <div style={{ textAlign: "center", marginBottom: "25px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "15px", border: "1px solid #e9ecef" }}>
                  <p style={{ color: "#7f8c8d", fontSize: "13px", textTransform: "uppercase", fontWeight: "bold", marginBottom: "10px" }}>Tên gọi IUPAC của chất này là gì?</p>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80px" }}>
                      <FormulaDisplay compound={scrambleTarget} isOption={false} />
                  </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px", marginBottom: "30px", animation: isScrambleWrong ? "shake 0.5s" : "none" }}>
                  {scrambleSlots.map((slot, idx) => (
                      <div key={idx}
                            onClick={() => handleScrambleSlotClick(idx)}
                            style={{
                              width: slot.isSymbol ? "12px" : "30px",
                              height: "40px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: slot.isSymbol ? "none" : `2px solid ${isScrambleWrong ? "#e74c3c" : slot.currentChar ? "#8e44ad" : "#bdc3c7"}`,
                              borderRadius: "8px",
                              backgroundColor: slot.isSymbol ? "transparent" : slot.currentChar ? "#f4eaff" : "#f8f9fa",
                              fontSize: "18px",
                              fontWeight: "bold",
                              color: isScrambleWrong ? "#e74c3c" : "#2c3e50",
                              cursor: (!slot.isSymbol && slot.currentChar) ? "pointer" : "default",
                              transition: "0.2s"
                            }}>
                            {slot.currentChar || ""}
                      </div>
                  ))}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}>
                  {scrambleLetters.map(letter => (
                      <button key={letter.id}
                              onClick={() => handleScrambleLetterClick(letter)}
                              disabled={letter.used}
                              style={{
                                  width: "42px",
                                  height: "48px",
                                  border: "none",
                                  borderRadius: "10px",
                                  backgroundColor: letter.used ? "#ecf0f1" : "#8e44ad",
                                  color: letter.used ? "#bdc3c7" : "#fff",
                                  fontSize: "20px",
                                  fontWeight: "bold",
                                  cursor: letter.used ? "default" : "pointer",
                                  boxShadow: letter.used ? "none" : "0 4px 0 #732d91",
                                  transform: letter.used ? "translateY(4px)" : "none",
                                  transition: "0.1s"
                              }}>
                          {letter.char}
                      </button>
                  ))}
              </div>
            </div>
          )}

          {quizStatus === "finished" && (
            <div style={{ textAlign: "center", padding: "30px 20px", backgroundColor: "#fff", borderRadius: "20px", border: "3px solid #f1c40f", boxShadow: "0 10px 25px rgba(241, 196, 15, 0.2)" }}>
              <div style={{ fontSize: "60px", marginBottom: "10px" }}>{getRanking().icon}</div>
              <div style={{ display: "inline-block", backgroundColor: getRanking().color, color: "#fff", padding: "5px 15px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold", marginBottom: "15px", textTransform: "uppercase" }}>
                Danh hiệu: {getRanking().title}
              </div>
              <p style={{ color: "#7f8c8d", fontSize: "14px", marginBottom: "25px", fontStyle: "italic" }}>"{getRanking().desc}"</p>

              <div style={{ display: "flex", justifyContent: "space-around", backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "15px", marginBottom: "25px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#95a5a6", fontWeight: "bold", textTransform: "uppercase" }}>Tổng Điểm</div>
                  <div style={{ fontSize: "35px", fontWeight: "900", color: "#3498db" }}>{score}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#95a5a6", fontWeight: "bold", textTransform: "uppercase" }}>Đã đáp đúng</div>
                  <div style={{ fontSize: "35px", fontWeight: "900", color: "#2ecc71" }}>{correctCount}</div>
                </div>
              </div>

              {score > 0 && (
                <div style={{ backgroundColor: "#fff9e6", padding: "15px", borderRadius: "15px", marginBottom: "25px", border: "1px dashed #f1c40f" }}>
                  {isScoreSaved ? (
                     <div style={{ color: "#2ecc71", fontWeight: "bold", fontSize: "15px", animation: "pulse 1s infinite alternate" }}>✅ Đã lưu kỷ lục của bạn vào Bảng vàng!</div>
                  ) : (
                     <>
                        <p style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold", color: "#d35400" }}>🏆 Chúc mừng bạn: {playerName}</p>
                        <button onClick={handleSaveToLeaderboard} style={{ width: "100%", padding: "12px", backgroundColor: "#f1c40f", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}>LƯU KẾT QUẢ VÀO BẢNG VÀNG</button>
                     </>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setQuizStatus("idle")} style={{ flex: 1, padding: "15px", backgroundColor: "#bdc3c7", color: "#2c3e50", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>🔙 Thoát</button>
                <button onClick={() => { if (currentQuizScope) startQuiz(currentQuizScope); }} style={{ flex: 2, padding: "15px", backgroundColor: "#e74c3c", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(231, 76, 60, 0.3)" }}>⚔️ Phục thù ngay!</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB TRA CỨU -------------------- */}
      {activeTab === "search" && (
        <div style={{ animation: "fadeIn 0.3s" }}>
          <div style={{ position: "relative", marginBottom: "25px" }}>
            <span style={{ position: "absolute", left: "15px", top: "14px", fontSize: "18px" }}>🔍</span>
            <input type="text" placeholder="Nhập tên, công thức..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "15px 15px 15px 45px", borderRadius: "15px", border: "2px solid #3498db", fontSize: "15px", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "25px", alignItems: "center" }}>
            {searchQuery === "" ? (
              <div style={{ textAlign: "center", color: "#7f8c8d", marginTop: "20px" }}><p style={{ fontSize: "40px", margin: "0 0 10px 0" }}>💡</p><p>Nhập từ khoá để tìm kiếm</p></div>
            ) : searchResults.length > 0 ? (
              <>
                <p style={{ color: "#2ecc71", fontWeight: "bold", margin: "0", alignSelf: "flex-start" }}>Tìm thấy {searchResults.length} kết quả:</p>
                {searchResults.map((compound) => (
                  <div key={compound.id} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <MolecularFlashcard compound={compound} mode="f2n" />
                    <Link to={`/compound/${compound.id}`} style={{ display: "inline-block", textDecoration: "none", color: "#3498db", fontSize: "12px", fontWeight: "bold", marginTop: "10px", padding: "8px 15px", backgroundColor: "#e8f4f8", borderRadius: "20px" }}>🔍 Xem chi tiết 3D ➔</Link>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#e74c3c", marginTop: "20px" }}><p style={{ fontSize: "40px", margin: "0 0 10px 0" }}>🥺</p><p>Không tìm thấy chất nào.</p></div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- TAB HƯỚNG DẪN -------------------- */}
      {activeTab === "guide" && (
        <div style={{ animation: "fadeIn 0.3s", paddingBottom: "20px" }}>
          <div style={{ textAlign: "center", marginBottom: "25px" }}>
            <h3
              style={{
                color: "#2c3e50",
                margin: "0 0 5px 0",
                fontSize: "22px",
              }}
            >
              📖 SỔ TAY DANH PHÁP
            </h3>
            <p style={{ color: "#7f8c8d", fontSize: "13px", margin: 0 }}>
              Chuẩn IUPAC
            </p>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "15px",
              padding: "20px",
              marginBottom: "20px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                backgroundColor: "#3498db",
                color: "#fff",
                display: "inline-block",
                padding: "5px 15px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "bold",
                marginBottom: "15px",
                textTransform: "uppercase",
              }}
            >
              I. Nguyên tắc chung
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "#2c3e50",
                lineHeight: "1.6",
                marginBottom: "15px",
              }}
            >
              Danh pháp thay thế (IUPAC) của hợp chất hữu cơ thường gồm 3 phần:
            </p>
            <div
              style={{
                display: "flex",
                gap: "5px",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  backgroundColor: "#e8f4f8",
                  border: "1px solid #3498db",
                  color: "#2980b9",
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  flex: 1,
                  textAlign: "center",
                }}
              >
                Vị trí + Tên nhánh <br />{" "}
                <span style={{ fontSize: "10px", fontWeight: "normal" }}></span>
              </div>
              <span style={{ fontSize: "20px", color: "#bdc3c7" }}>+</span>
              <div
                style={{
                  backgroundColor: "#eefaf1",
                  border: "1px solid #2ecc71",
                  color: "#27ae60",
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  flex: 1,
                  textAlign: "center",
                }}
              >
                Tiền tố <br />{" "}
                <span style={{ fontSize: "10px", fontWeight: "normal" }}>
                  (Số nguyên tử carbon mạch chính: Meth, Eth, Prop...)
                </span>
              </div>
              <span style={{ fontSize: "20px", color: "#bdc3c7" }}>+</span>
              <div
                style={{
                  backgroundColor: "#fdedec",
                  border: "1px solid #e74c3c",
                  color: "#c0392b",
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  flex: 1,
                  textAlign: "center",
                }}
              >
                Hậu tố <br />{" "}
                <span style={{ fontSize: "10px", fontWeight: "normal" }}>
                  (ane, ene, ol, al...)
                </span>
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "#2c3e50",
              lineHeight: "1.6",
              marginBottom: "15px",
            }}
          >
            Quy tắc về số và chữ: Giữa số và số dùng dấu phẩy (,), giữa số và
            chữ dùng dấu gạch nối (-).
          </p>
          <span style={{ fontSize: "10px", fontWeight: "normal" }}></span>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "15px",
              padding: "20px",
              marginBottom: "20px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                backgroundColor: "#e67e22",
                color: "#fff",
                display: "inline-block",
                padding: "5px 15px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "bold",
                marginBottom: "15px",
                textTransform: "uppercase",
              }}
            >
              II. Hoá Học 11
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div
                style={{ borderLeft: "4px solid #f39c12", paddingLeft: "10px" }}
              >
                <strong style={{ color: "#d35400", fontSize: "15px" }}>
                  1. HIDROCARBON
                </strong>
                <p
                  style={{
                    margin: "5px 0",
                    fontSize: "13px",
                    color: "#34495e",
                  }}
                >
                  • <b>Alkane:</b> Vị trí nhánh - Tên nhánh + Tên tiền tố (mạch
                  chính) +{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    ane
                  </span>
                  <br />
                  <i style={{ color: "#7f8c8d", fontSize: "12px" }}>
                    Lưu ý: Mạch chính là mạch C dài nhất và có nhiều nhánh nhất.
                    Đánh số thứ tự các nguyên tử C trên mạch chính từ đầu gần
                    nhánh nhất. Tên nhánh gọi theo thứ tự vần chữ cái. Nếu có
                    nhiều nhánh cùng tên thì sau tất cả các số chỉ vị trí của
                    chúng, trước tên nhánh thêm (di, tri, tetra…) để chỉ số
                    lượng nhánh cùng tên.
                  </i>
                  <br />
                  <br />• <b>Alkene và Alkyne:</b> Vị trí nhánh - Tên nhánh +
                  Tên tiền tố (mạch chính) - vị trí liên kết bội -{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    Tên hậu tố (ene/yne)
                  </span>
                  <br />
                  <i style={{ color: "#7f8c8d", fontSize: "12px" }}>
                    Lưu ý: Chọn mạch chính chứa liên kết bội, đánh số ưu tiên
                    đầu gần liên kết bội.
                  </i>
                  <br />
                  <br />• <b>Arene:</b> Tên nhóm alkyl +{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    benzene
                  </span>
                  <br />
                  <i style={{ color: "#7f8c8d", fontSize: "12px" }}>
                    Lưu ý: Khi có hai nhóm thế trên vòng benzene, vị trí của
                    chúng có thể được chỉ ra bằng các chữ số 1,2; 1,3 hay 1,4
                    hoặc bằng các chữ tương ứng là ortho (o), meta (m) hay para
                    (p)
                  </i>
                </p>
              </div>
              <div
                style={{ borderLeft: "4px solid #f39c12", paddingLeft: "10px" }}
              >
                <strong style={{ color: "#d35400", fontSize: "15px" }}>
                  2. DẪN XUẤT HALOGEN - ALCOHOL - PHENOL
                </strong>
                <p
                  style={{
                    margin: "5px 0",
                    fontSize: "13px",
                    color: "#34495e",
                  }}
                >
                  • <b>Dẫn xuất halogen: </b> Vị trí nhóm thể - Tên nhóm thể
                  halogen{""}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    o{" "}
                  </span>{" "}
                  + Tên hydrocarbon
                  <br />
                  <i style={{ color: "#7f8c8d", fontSize: "12px" }}>
                    Lưu ý: nhóm thế halogeno (fluoro, chloro, bromo, iodo).
                  </i>
                  <br /> Tên gốc - chức: Tên gốc hydrocarbon halide
                  <br /> (Ví dụ: ethyl chloride).
                  <br />
                  <br />• <b>Alcohol đơn chức:</b> Tên hydrocarbon (bỏ kí tự "e"
                  ở cuối) - Vị trí nhóm -OH -{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    ol
                  </span>
                  <br />• <b>Alcohol đa chức:</b> Tên hydrocarbon - Vị trí nhóm
                  -OH - Từ chỉ số lượng nhóm -OH (di, tri,...) +{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    ol
                  </span>
                  <br />
                  <i style={{ color: "#7f8c8d", fontSize: "12px" }}>
                    Lưu ý: Mạch chính là mạch carbon có nhóm -OH và dài nhất.
                    Đánh số thứ tự: từ đầu gần nhóm -OH nhất.
                  </i>
                  <br />
                  <br />• <b>Phenol:</b> Đọc tên theo vị trí các nhóm thế trên
                  vòng benzene đính với nhóm -OH.
                  <br />
                  <i style={{ color: "#7f8c8d", fontSize: "12px" }}>
                    Lưu ý: ưu tiên đánh số 1 từ C có nhóm -OH, rồi theo chiều
                    sao cho các nhánh khác có số nhỏ nhất.
                  </i>
                </p>
              </div>
              <div
                style={{ borderLeft: "4px solid #f39c12", paddingLeft: "10px" }}
              >
                <strong style={{ color: "#d35400", fontSize: "15px" }}>
                  3. ALDEHYDE & CARBOXYLIC ACID
                </strong>
                <p
                  style={{
                    margin: "5px 0",
                    fontSize: "13px",
                    color: "#34495e",
                  }}
                >
                  • <b>Aldehyde:</b> Tên hydrocarbon (bỏ kí tự "e" ở cuối) +{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    al
                  </span>{" "}
                  <br />
                  <i style={{ color: "#7f8c8d", fontSize: "12px" }}>
                    Lưu ý: Đánh số các nguyên tử C ở mạch chính bắt đầu ở nguyên
                    tử C của nhóm -CHO.
                  </i>
                  <br /> Tên thông thường: thay "...ic acid" bằng "...ic
                  aldehyde" hoặc "...aldehyde"
                  <br />• <b>Ketone:</b> Tên hydrocarbon (bỏ kí tự "e" ở cuối) -
                  Vị trí nhóm carbonyl -{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    one
                  </span>{" "}
                  <br />
                  <i style={{ color: "#7f8c8d", fontSize: "12px" }}>
                    Lưu ý: Đánh số các nguyên tử C ở mạch chính bắt đầu từ
                    nguyên tử C gần nhóm C=O nhất.
                  </i>
                  <br />
                  <br />• <b>Acid:</b> Vị trí nhánh - Tên nhánh + Tên
                  hydrocarbon (bỏ kí tự "e" ở cuối) +{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    oic
                  </span>{" "}
                  acid
                  <br />
                  (Ví dụ: Ethan
                  <span style={{ color: "#e74c3c" }}>oic</span> acid)
                </p>
              </div>
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "15px",
              padding: "20px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                backgroundColor: "#9b59b6",
                color: "#fff",
                display: "inline-block",
                padding: "5px 15px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "bold",
                marginBottom: "15px",
                textTransform: "uppercase",
              }}
            >
              III. Hoá Học 12
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div
                style={{ borderLeft: "4px solid #8e44ad", paddingLeft: "10px" }}
              >
                <strong style={{ color: "#8e44ad", fontSize: "15px" }}>
                  1. ESTER (R-COO-R')
                </strong>
                <p
                  style={{
                    margin: "5px 0",
                    fontSize: "13px",
                    color: "#34495e",
                  }}
                >
                  <span style={{ color: "#2980b9", fontWeight: "bold" }}>
                    Tên gốc R'
                  </span>{" "}
                  +{" "}
                  <span style={{ color: "#27ae60", fontWeight: "bold" }}>
                    Tên gốc acid RCOO
                  </span>{" "}
                  (đổi đuôi ic thành{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    ate
                  </span>
                  )<br />
                  <i style={{ color: "#7f8c8d" }}>
                    Ví dụ: <span style={{ color: "#2980b9" }}>Methyl</span>{" "}
                    <span style={{ color: "#27ae60" }}>methano</span>
                    <span style={{ color: "#e74c3c" }}>ate</span> (HCOOCH
                    <sub>3</sub>)
                  </i>
                </p>
              </div>
              <div
                style={{ borderLeft: "4px solid #8e44ad", paddingLeft: "10px" }}
              >
                <strong style={{ color: "#8e44ad", fontSize: "15px" }}>
                  2. AMINE
                </strong>
                <p
                  style={{
                    margin: "5px 0",
                    fontSize: "13px",
                    color: "#34495e",
                  }}
                >
                  Tên gốc chức: Tên gốc hydrocarbon +{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    amine
                  </span>{" "}
                  <br />
                  <br />• <b>Amine bậc một:</b> Tên hydrocarbon (bỏ kí tự "e" ở
                  cuối) - vị trí nhóm -NH<sub>2</sub> -{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    amine
                  </span>{" "}
                  <br />
                  <br />• <b>Amine bậc hai:</b> N-tên gốc hydrocarbon + tên
                  hydrocarbon mạch dài nhất (bỏ kí tự "e" ở cuối) - vị trí nhóm
                  amine -{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    amine
                  </span>{" "}
                  <br />
                  <br />• <b>Amine bậc ba:</b> N-tên gốc hydrocarbon thứ nhất -
                  N-tên gốc hydrocarbon thứ hai + tên hydrocarbon mạch dài nhất
                  (bỏ kí tự "e" ở cuối) - vị trí nhóm amine -{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    amine
                  </span>
                </p>
              </div>
              <div
                style={{ borderLeft: "4px solid #8e44ad", paddingLeft: "10px" }}
              >
                <strong style={{ color: "#8e44ad", fontSize: "15px" }}>
                  3. AMINO ACID
                </strong>
                <p
                  style={{
                    margin: "5px 0",
                    fontSize: "13px",
                    color: "#34495e",
                  }}
                >
                  <span style={{ color: "#2980b9", fontWeight: "bold" }}>
                    Vị trí của nhóm amino - amino
                  </span>{" "}
                  +{" "}
                  <span style={{ color: "#27ae60", fontWeight: "bold" }}>
                    Tên của carboxylic acid tương ứng
                  </span>
                  <br />
                  <i style={{ color: "#7f8c8d", fontSize: "12px" }}>
                    Lưu ý: Vị trí của nhóm amino (2, 3, 4,...) là vị trí của
                    nguyên tử C trong mạch C của carboxylic acid liên kết trực
                    tiếp với nhóm này, tính từ nguyên tử C của nhóm carbonyl.
                  </i>
                  <br /> Tên bán hệ thống: thay vị trí của các nhóm amino (2 ,3,
                  4,...) bằng các chữ cái Hy Lạp và dùng tên thông thường của
                  carboxylic acid.
                </p>
              </div>
              <div
                style={{ borderLeft: "4px solid #8e44ad", paddingLeft: "10px" }}
              >
                <strong style={{ color: "#8e44ad", fontSize: "15px" }}>
                  4. POLYMER
                </strong>
                <p
                  style={{
                    margin: "5px 0",
                    fontSize: "13px",
                    color: "#34495e",
                  }}
                >
                  <span style={{ color: "#2980b9", fontWeight: "bold" }}>
                    poly
                  </span>{" "}
                  +{" "}
                  <span style={{ color: "#27ae60", fontWeight: "bold" }}>
                    tên của monomer
                  </span>
                  <br />
                  <i style={{ color: "#7f8c8d", fontSize: "12px" }}>
                    Lưu ý: Nếu tên của monomer gồm hai tử trở lên hoặc polymer
                    được hình thành từ hai loại monomer trở lên thì tên của
                    monomer được đặt trong dấu ngoặc đơn.
                    <br /> (ví dụ: poly(vinyl chloride))
                  </i>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* KHỐI CSS GỘP CHUNG TẤT CẢ ANIMATION */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-6px); }
        }
      `}</style>
    </div>
  );
}

export default HomePage;
