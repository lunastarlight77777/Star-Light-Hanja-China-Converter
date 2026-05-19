/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Next.js 프로젝트를 정적 HTML/CSS/JS 파일로 변환해줍니다.
  images: {
    unoptimized: true, // GitHub Pages에서 이미지 로딩 에러가 나는 것을 방지합니다.
  },
};

module.exports = nextConfig;