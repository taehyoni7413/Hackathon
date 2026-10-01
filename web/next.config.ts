import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // 로컬 개발용: 브라우저의 /api/* 요청을 같은 경로 그대로 FastAPI 로 전달.
  // Vercel 배포에서는 vercel.json 의 상위 rewrite 가 /api/* 를 api 서비스로 먼저 보내므로 여기까지 오지 않는다.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
