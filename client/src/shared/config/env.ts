export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "https://shadowforge.onrender.com/api",
  DEV_FAKE_TOKEN: import.meta.env.VITE_DEV_FAKE_TOKEN ?? "",
} as const;
