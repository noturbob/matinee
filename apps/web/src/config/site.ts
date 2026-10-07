export const siteConfig = {
  name: "Matinee",
  description: "Watch together, anywhere.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
} as const;

export const routes = {
  home: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  room: (id: string) => `/room/${id}`,
  profile: (username: string) => `/profile/${username}`,
  guild: (id: string) => `/guild/${id}`,
  leaderboard: "/leaderboard",
  events: "/events",
  settings: "/settings",
} as const;