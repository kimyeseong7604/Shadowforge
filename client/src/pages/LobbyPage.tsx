// src/pages/LobbyPage.tsx
import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../stores/game.store";
import { useAuthStore } from "../stores/auth.store";
import GameFrame from "../components/GameFrame";
import AlertModal from "../components/AlertModal";




const BG = "/lobby.png";
const BTN_NEW = "/gadgets/NEW GAME.png";
const BTN_CONTINUE = "/gadgets/continue.png";
const BTN_GUIDE = "/gadgets/GUIDE.png";

type BtnKey = "NEW" | "CONTINUE" | "GUIDE" | null;

export default function LobbyPage() {
  const navigate = useNavigate();
  const startGame = useGameStore((s) => s.startGame);
  const gameData = useGameStore((s) => s.gameData);
  const { userId } = useAuthStore();

  // Local UI
  const [hovered, setHovered] = useState<BtnKey>(null);
  const [pressed, setPressed] = useState<BtnKey>(null);

  // Custom Alert State
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  const showAlert = (title: string, message: string, onConfirm: () => void, isConfirm = false) => {
    setAlert({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setAlert(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: isConfirm ? () => setAlert(prev => ({ ...prev, isOpen: false })) : undefined,
    });
  };



  const onNew = async () => {
    try {
      if (gameData && gameData.hp > 0) {
        showAlert("새 게임 시작", "이미 진행 중인 게임이 있습니다. 무시하고 새로 시작하시겠습니까?", async () => {
          await startGame(userId || 1);
          navigate("/turn");
        }, true);
      } else {
        await startGame(userId || 1);
        navigate("/turn");
      }
    } catch (e) {
      showAlert("오류", "게임 시작에 실패했습니다.", () => { });
    }
  };

  const onContinue = () => {
    // 게임 데이터가 없거나(null), 체력이 0(게임오버)인 경우 모두 이어하기 불가
    if (gameData && gameData.hp > 0) {
      const stats = [
        "📜 이전에 멈췄던 곳에서 여정을 이어간다.",
        `💖 현재 체력: ${gameData.hp}/${gameData.maxHp}`,
        `💰 보유 금화: ${gameData.gold}`,
        `⚔️ 힘: ${gameData.str} | 💨 민첩: ${gameData.agi}`,
        `🧪 포션 개수: ${gameData.potions}개`
      ];
      useGameStore.getState().pushLog(stats);
      navigate("/turn");
    } else {
      showAlert("안내", "이어할 모험 데이터가 없습니다. 새로운 모험을 시작하세요!", () => { });
    }
  };

  const onLogout = () => {
    showAlert("로그아웃", "정말로 로그아웃 하시겠습니까?", () => {
      useAuthStore.getState().logout();
      navigate("/");
    }, true);
  };

  const onGuide = () => navigate("/guide");

  const getBtnStyle = (key: Exclude<BtnKey, null>): CSSProperties => {
    const isHover = hovered === key;
    const isDown = pressed === key;

    return {
      ...styles.imgBtn,
      transform: isDown
        ? "translateY(3px) scale(0.98)"
        : isHover
          ? "translateY(-3px) scale(1.02)"
          : "translateY(0px) scale(1)",
      filter: isDown
        ? "drop-shadow(0 6px 14px rgba(0,0,0,0.55))"
        : isHover
          ? "drop-shadow(0 14px 26px rgba(0,0,0,0.65))"
          : "drop-shadow(0 10px 20px rgba(0,0,0,0.55))",
    };
  };

  return (
    <GameFrame bg={BG}>
      <button type="button" onClick={onLogout} style={styles.topRightBtn}>
        로그아웃
      </button>

      <div style={styles.centerWrap}>
        <button
          type="button"
          onClick={onNew}
          style={{ ...getBtnStyle("NEW"), marginBottom: -8 }}
          onMouseEnter={() => setHovered("NEW")}
          onMouseLeave={() => { setHovered(null); setPressed(null); }}
          onMouseDown={() => setPressed("NEW")}
          onMouseUp={() => setPressed(null)}
        >
          <img src={BTN_NEW} alt="NEW GAME" style={styles.img} draggable={false} />
        </button>

        <button
          type="button"
          onClick={onContinue}
          style={getBtnStyle("CONTINUE")}
          onMouseEnter={() => setHovered("CONTINUE")}
          onMouseLeave={() => { setHovered(null); setPressed(null); }}
          onMouseDown={() => setPressed("CONTINUE")}
          onMouseUp={() => setPressed(null)}
        >
          <img src={BTN_CONTINUE} alt="CONTINUE" style={styles.img} draggable={false} />
        </button>

        <button
          type="button"
          onClick={onGuide}
          style={{ ...getBtnStyle("GUIDE"), marginBottom: -8 }}
          onMouseEnter={() => setHovered("GUIDE")}
          onMouseLeave={() => { setHovered(null); setPressed(null); }}
          onMouseDown={() => setPressed("GUIDE")}
          onMouseUp={() => setPressed(null)}
        >
          <img src={BTN_GUIDE} alt="GUIDE" style={styles.img} draggable={false} />
        </button>
      </div>

      <AlertModal
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
      />
    </GameFrame>
  );
}


const styles: Record<string, CSSProperties> = {
  topRightBtn: {
    position: "absolute",
    top: 18,
    right: 18,
    padding: "10px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.35)",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    backdropFilter: "blur(6px)",
  },

  centerWrap: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    gap: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "min(360px, 52%)",
  },

  imgBtn: {
    width: "100%",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    transition: "transform 140ms ease, filter 140ms ease",
    borderRadius: 16,
    outline: "none",
  },

  img: {
    width: "100%",
    height: "auto",
    display: "block",
    userSelect: "none",
    pointerEvents: "none",
  },
};
