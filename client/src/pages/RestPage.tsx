// src/pages/RestPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameFrame from "../components/GameFrame";
import { useGameStore } from "../stores/game.store";

const BG = "/turn.png";

export default function RestPage() {
  const navigate = useNavigate();

  const gameData = useGameStore((s) => s.gameData);
  const userId = useGameStore((s) => s.userId);
  const confirmRest = useGameStore((s) => s.confirmRest);

  const [healed, setHealed] = useState(false);

  useEffect(() => {
    if (!gameData || !userId) navigate("/");
  }, [gameData, userId, navigate]);

  const onRest = async () => {
    if (healed || !userId) return;
    try {
      await confirmRest(userId);
      setHealed(true);
      setTimeout(() => {
        navigate("/turn");
      }, 1200);
    } catch (e) {
      console.error(e);
    }
  };

  const hp = gameData?.hp ?? 0;
  const maxHp = gameData?.maxHp ?? 100;

  return (
    <GameFrame>
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(${BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "min(600px, 90%)",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(12px)",
              padding: 40,
              borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.15)",
              textAlign: "center",
              boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontSize: 14, color: "#aaa", fontWeight: 800, marginBottom: 12 }}>STAGE {gameData?.currentTurn}</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", marginBottom: 8 }}>고즈넉한 휴식</div>
            <div style={{ color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>모닥불 근처에서 몸을 추스릅니다.</div>

            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>
                <span>HP RECOVERY</span>
                <span>{hp} / {maxHp}</span>
              </div>
              <div style={{ width: "100%", height: 12, background: "rgba(255,255,255,0.1)", borderRadius: 6, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(hp / maxHp) * 100}%`,
                    background: "linear-gradient(90deg, #43a047, #66bb6a)",
                    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
            </div>

            <button
              onClick={onRest}
              disabled={healed}
              style={{
                width: "100%",
                height: 54,
                borderRadius: 12,
                border: "none",
                background: healed ? "rgba(255,255,255,0.1)" : "#fff",
                color: healed ? "#666" : "#000",
                fontSize: 16,
                fontWeight: 800,
                cursor: healed ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {healed ? "회복 완료" : "체력 회복하기"}
            </button>

            {healed && (
              <div style={{ marginTop: 20, color: "#66bb6a", fontWeight: 800, fontSize: 14, animation: "fadeIn 0.5s" }}>
                당신의 몸과 마음이 치유되었습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </GameFrame>
  );
}
