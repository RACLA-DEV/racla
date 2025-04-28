# 🎮 RACLA Desktop App (Vite)

<div align="center">
  <img src="https://cdn.gongroin.com/gongroin/og-image-racla.png" alt="RACLA" width="600">
  
  <p><strong>종합리듬 게임 성과 관리 도구</strong></p>
  
  <p>
    <img src="https://img.shields.io/github/license/RACLA-DEV/racla-vite?color=blue" alt="License">
    <img src="https://img.shields.io/badge/platforms-Windows-brightgreen" alt="Platforms">
    <a href="https://github.com/RACLA-DEV/racla/actions/workflows/build.yml"><img src="https://github.com/RACLA-DEV/racla/actions/workflows/build.yml/badge.svg?branch=main" alt="Build Verification"></a>
    <a href="https://app.codacy.com/gh/RACLA-DEV/racla/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade"><img src="https://app.codacy.com/project/badge/Grade/e6c8071c93564fcbb7624bd09e912a1a"/></a>
  </p>
</div>

## 📋 개요

RACLA는 **GGDRN0 STUDIO**에서 개발한 종합리듬 게임 성과 관리 도구입니다.  
해당 브랜치에서는 Vite로 개발된 RACLA 데스크톱 앱의 소스코드와 최종 결과물인 소프트웨어를 **Windows** 플랫폼으로 배포합니다.

> 📢 **안내**: 0.7 버전대까지 사용된 Nextron 기반의 데스크톱 앱의 소스코드는 [RACLA-DEV/racla](https://github.com/RACLA-DEV/racla/tree/main-nextron)에서 확인하실 수 있습니다.

## 🛠️ 개발 환경 설정

### 필수 요구사항

- Node.js 22.14.0 이상
- pnpm 10.10.0 이상 (`npm install -g pnpm@10.10.0`)
- 윈도우 개발 환경 (윈도우 10/11)

### 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.development`와 `.env.production` 파일을 만들고 필요한 값을 설정하세요:

```bash
# API 및 CDN URL 설정
VITE_API_URL=https://api.racla.app/api
VITE_CDN_URL=https://cdn.racla.app
# 디스코드 통합을 위한 설정
DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID
```

## 📦 프로젝트 설치 및 실행

### 설치

```bash
# 의존성 설치
pnpm install
```

### 개발 모드 실행

```bash
# 개발 서버 시작
pnpm dev

# 디버그 모드로 실행
pnpm debug
```

### 빌드

```bash
# 프로덕션 빌드
pnpm build

# 개발 환경용 빌드
pnpm build-dev
```

## 📂 프로젝트 구조

```
racla/
├── .github/                # GitHub 워크플로우 및 설정
├── scripts/                # 빌드 및 유틸리티 스크립트
├── resources/              # 애플리케이션 리소스 파일
├── src/                    # 소스 코드
│   ├── main/               # 메인 프로세스 (Electron)
│   ├── render/             # 렌더러 프로세스 (React)
│   ├── preload/            # 프리로드 스크립트
│   ├── libs/               # 공유 라이브러리
│   └── types/              # TypeScript 타입 정의
├── .env.development        # 개발 환경 변수
├── .env.production         # 프로덕션 환경 변수
├── .env.example            # 환경 변수 예제 파일
├── electron-builder.config.js # Electron 빌더 설정
├── vite.config.mts         # Vite 설정
└── tsconfig.json           # TypeScript 설정
```

## 🔧 기술 스택

- **프레임워크**: Electron 35, React 19, NestJS 11, DoubleShot
- **상태 관리**: Redux Toolkit, Redux Persist
- **스타일링**: TailwindCSS 4
- **빌드 도구**: Vite 6, Electron Builder, DoubleShot Builder
- **언어**: TypeScript
- **패키지 관리자**: pnpm

## 🎵 지원 게임

<table>
  <tr>
    <td><b>🎹 DJMAX RESPECT V</b></td>
    <td>
      <a href="https://store.steampowered.com/app/960170/DJMAX_RESPECT_V/">디제이맥스 리스펙트 V</a><br>
      웹 성과 관리 도구 <a href="https://v-archive.net">V-ARCHIVE</a>, <a href="https://hard-archive.com">전일 아카이브</a>와 연동됩니다.
    </td>
  </tr>
  <tr>
    <td><b>🎮 WJMAX</b></td>
    <td>
      <a href="https://waktaverse.games/gameDetail/wjmax/">왁제이맥스</a><br>
      RACLA 자체 구축 서비스로 운영됩니다.
    </td>
  </tr>
  <tr>
    <td><b>🎧 PLATiNA::LAB</b></td>
    <td>
      <a href="https://platinalab.net/">플라티나 랩</a><br>
      RACLA 자체 구축 서비스로 운영됩니다.
    </td>
  </tr>
</table>

## 💬 TMI

> ⚠️ Nextron 기반의 RACLA 데스크톱 앱은 0.7.16 업데이트를 기점으로 더 이상 유지 보수되지 않습니다. ~(다시는 만나지 말자...)~
>
> 단, 해당 기반의 데스크톱 앱을 유지 보수하거나 이끌고가실 분이 계시다면 언제든지 편하게 연락주시길 바랍니다. 😊

✨ Vite is Best.

## 📜 라이선스

### 소프트웨어 라이선스

> 이 소프트웨어의 소스코드는 [MIT 라이선스](https://github.com/RACLA-DEV/racla/blob/main/LICENSE)에 따라 제공됩니다.
>
> 자세한 내용은 소스코드에 포함된 `LICENSE` 파일을 참조하시기 바랍니다.

### 제3자 리소스

⚠️ 본 소프트웨어에는 제3자의 이미지, 아이콘, 폰트 등 일부 리소스가 포함되어 있을 수 있습니다.

- 이러한 제3자 리소스는 각각의 라이선스 조건이 적용됩니다
- 해당 리소스의 원저작자가 명시한 라이선스를 반드시 준수해야 합니다
