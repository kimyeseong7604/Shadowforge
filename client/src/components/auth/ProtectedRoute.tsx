import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { useGameStore } from "../../stores/game.store";

/**
 * 🔐 ProtectedRoute
 * 중앙 집중식 인증 및 세션 복구 가드입니다.
 * 1. 로컬 스토리지에 토큰이 있는지 확인합니다.
 * 2. 토큰은 있지만 gameData가 없는 경우(새로고침 등), 데이터를 먼저 복구합니다.
 * 3. 데이터 로딩 중에는 로딩 화면을 보여주어 개별 페이지의 엇박자 리다이렉트를 방지합니다.
 */
export default function ProtectedRoute() {
    const location = useLocation();
    const { accessToken } = useAuthStore();
    const { gameData, isLoading, loadUserData } = useGameStore();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem("sf_access_token");

            // 1. 토큰이 아예 없는 경우 -> 로그인으로 튕김
            if (!accessToken && !storedToken) {
                setIsChecking(false);
                return;
            }

            // 2. 토큰은 있는데 gameData가 없는 경우 (새로고침 직후 등) -> 데이터 복구 시도
            if (!gameData && !isLoading) {
                try {
                    await loadUserData();
                } catch (e) {
                    console.error("Session recovery failed", e);
                }
            }

            setIsChecking(false);
        };

        checkAuth();
    }, [accessToken, gameData, isLoading, loadUserData]);

    // 초기 토큰 확인 및 데이터 로딩 중 가드
    if (isChecking || (localStorage.getItem("sf_access_token") && !gameData && isLoading)) {
        return (
            <div style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "black",
                color: "white"
            }}>
                <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>SHADOWFORGE</div>
                <div style={{ opacity: 0.7 }}>세션을 복구하고 있습니다...</div>
            </div>
        );
    }

    // 3. 최종 확인 후 토큰이 없으면 로그인으로
    if (!accessToken && !localStorage.getItem("sf_access_token")) {
        // 현재 시도했던 경로를 state로 넘겨 로그인 후 돌아올 수 있게 할 수도 있음
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
