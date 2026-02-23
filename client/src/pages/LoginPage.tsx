import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "min(560px, 92vw)",
          borderRadius: 18,
          padding: 24,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(6px)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>
          로그인
        </div>

        <div style={{ opacity: 0.85, lineHeight: 1.5, marginBottom: 18 }}>
          백엔드 연동 준비중입니다. <br />
          로그인 DB/인증이 연결되면 이 화면에서 처리할 수 있게 붙이면 됩니다.
        </div>

        <button
          type="button"
          onClick={() => navigate("/")} // <--- 여기 수정(원하면 /lobby로 변경 가능)
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "white",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          타이틀로 돌아가기
        </button>
      </div>
    </div>
  );
}