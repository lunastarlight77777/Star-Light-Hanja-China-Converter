/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export' <- 이 줄은 반드시 지우거나 이렇게 주석 처리해야 합니다!
  images: {
    unoptimized: true, // 이미지 최적화 비활성화는 그대로 두셔도 괜찮습니다.
  },
};

module.exports = nextConfig;