import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 빌드 시 TypeScript 오류가 있어도 배포를 진행 (필요시)
  typescript: {
    ignoreBuildErrors: true, 
  }
};

export default nextConfig;
