import { create } from "zustand";
import { env } from "../shared/config/env";
import { storage } from "../shared/utils/storage";

const TOKEN_KEY = "sf_access_token";

type AuthState = {
  accessToken: string | null;
  userId: number | null;
  setToken: (token: string | null) => void;
  initToken: () => void;
  logout: () => void;
};

const getInitialAuth = () => {
  const saved = storage.get(TOKEN_KEY);
  if (!saved) return { accessToken: null, userId: null };

  try {
    const parts = saved.split('.');
    if (parts.length < 2) {
      // JWT 형식이 아님 (예: 개발용 가짜 토큰)
      return { accessToken: saved, userId: null };
    }
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { accessToken: saved, userId: payload.sub };
  } catch (e) {
    console.error("Token decode error during store creation", e);
    return { accessToken: saved, userId: null }; // 디코딩 실패해도 토큰은 유지
  }
};

const initialAuth = getInitialAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: initialAuth.accessToken,
  userId: initialAuth.userId,

  setToken: (token) => {
    let uid = null;
    if (token) {
      storage.set(TOKEN_KEY, token);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        uid = payload.sub;
      } catch (e) {
        console.error("Token decode error", e);
      }
    } else {
      storage.remove(TOKEN_KEY);
    }
    set({ accessToken: token, userId: uid });
  },

  initToken: () => {
    // 이미 초기화 환경에서 로드되었으므로, 추가 주입 로직만 수행
    if (get().accessToken) return;

    // 개발용 가짜 토큰 자동 주입
    if (env.DEV_FAKE_TOKEN) {
      storage.set(TOKEN_KEY, env.DEV_FAKE_TOKEN);
      set({ accessToken: env.DEV_FAKE_TOKEN });
    }
  },

  logout: () => {
    get().setToken(null);
  },
}));
