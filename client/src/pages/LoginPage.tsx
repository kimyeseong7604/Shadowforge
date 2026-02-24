import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    // 이미 로그인된 경우 타이틀로 리다이렉트
    if (accessToken && !searchParams.has("token")) {
      navigate("/");
      return;
    }

    const token = searchParams.get("token");
    if (token) {
      setToken(token);
      // 토큰 설정 후 즉시 리다이렉트 (searchParams 제거 효과)
      navigate("/", { replace: true });
    }
  }, [searchParams, setToken, navigate, accessToken]);


  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL || "https://shadowforge.onrender.com";
    window.location.href = `${backendUrl}/api/auth/google`;
  };

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
          width: "min(400px, 92vw)",
          borderRadius: 24,
          padding: 32,
          background: "rgba(15, 15, 20, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          color: "white",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>
          SHADOWFORGE
        </div>

        <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 32 }}>
          로그인 해주세요.
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            background: "#ffffff",
            color: "#000000",
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "transform 0.2s",
            marginBottom: 16,
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <img
            src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
            alt="Google"
            style={{ width: 20, height: 20 }}
          />
          Google로 로그인
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.5)",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          타이틀로 돌아가기
        </button>
      </div>
    </div>
  );
}
