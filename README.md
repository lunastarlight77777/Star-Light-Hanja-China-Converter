# 🇨🇳 한국어 이름 중국어 변환기

한국어 이름을 간화자(简化字)와 한어병음(拼音)으로 변환해주는 웹사이트예요.

## 로컬에서 실행하기

### 1. 패키지 설치
```bash
npm install
```

### 2. API 키 설정
`.env.local.example` 파일을 복사해서 `.env.local`로 이름을 바꾸고, Claude API 키를 입력하세요.

```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열어서:
```
ANTHROPIC_API_KEY=sk-ant-여기에_실제_키_입력
```

> Claude API 키는 https://console.anthropic.com 에서 발급받을 수 있어요.

### 3. 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속하면 돼요!

---

## Vercel에 무료 배포하기

### 1. GitHub에 업로드
- [github.com](https://github.com) 에서 새 저장소(repository) 만들기
- 이 폴더의 파일들을 업로드

### 2. Vercel 연결
- [vercel.com](https://vercel.com) 가입 (GitHub 계정으로 로그인 가능)
- "Add New Project" → GitHub 저장소 선택
- "Deploy" 클릭

### 3. API 키 환경변수 설정
Vercel 대시보드에서:
- 프로젝트 → Settings → Environment Variables
- `ANTHROPIC_API_KEY` 추가 → 값에 API 키 입력
- Redeploy 하면 완성!

---

## 기능

- 한글 또는 한자로 이름 입력 가능
- **한자 기반 변환**: 이름의 한자 의미를 살려 간화자로 변환
- **발음 기반 변환**: 한국어 발음을 중국어 음절로 음역
- 두 가지 방식 동시 지원
- 한어병음 성조 표시 포함
