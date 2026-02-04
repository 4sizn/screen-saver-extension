# Screen Saver Web Extension - 개발 가이드

이 문서는 Screen Saver Web Extension의 개발, 빌드, 배포 과정을 설명합니다.

## 📋 목차

1. [프로젝트 개요](#-프로젝트-개요)
2. [기술 스택](#-기술-스택)
3. [개발 환경 설정](#-개발-환경-설정)
4. [개발 모드 실행](#-개발-모드-실행)
5. [빌드 방법](#-빌드-방법)
6. [로컬 테스트](#-로컬-테스트)
7. [버전 관리](#-버전-관리)
8. [GitHub 릴리즈 생성](#-github-릴리즈-생성)
9. [Chrome Web Store 배포](#-chrome-web-store-배포)
10. [프로젝트 구조](#-프로젝트-구조)
11. [제한된 페이지](#-제한된-페이지)
12. [문제 해결](#-문제-해결)

---

## 📖 프로젝트 개요

Screen Saver Web Extension은 브라우저에서 스크린세이버 기능을 제공하는 Chrome 확장 프로그램입니다.

### 주요 기능
- 사용자 정의 이미지 슬라이드쇼
- 디지털 시계 표시
- 다국어 지원 (i18n)
- 사용자 설정 저장 및 관리

---

## 🛠 기술 스택

- **프레임워크**: [WXT](https://wxt.dev/) - Modern Web Extension Framework
- **UI 라이브러리**: React 19
- **스타일링**: TailwindCSS 4
- **언어**: TypeScript
- **빌드 도구**: Vite
- **데이터베이스**: IndexedDB (via idb)
- **패키지 매니저**: npm

---

## ⚙️ 개발 환경 설정

### 필수 요구사항

- Node.js 18.x 이상
- npm 9.x 이상
- Git

### 초기 설정

```bash
# 저장소 클론
git clone https://github.com/4sizn/screen-saver-extension.git
cd screen-saver-web

# 의존성 설치
npm install
```

---

## 🚀 개발 모드 실행

개발 모드는 파일 변경을 감지하여 자동으로 리로드됩니다.

```bash
npm run dev
```

### 브라우저에 로드하기

1. Chrome 브라우저를 열고 `chrome://extensions/` 로 이동
2. 우측 상단의 "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. 프로젝트 폴더의 `.output/chrome-mv3` 디렉토리 선택

개발 모드에서는 코드 변경 시 자동으로 빌드되며, 확장 프로그램 페이지에서 새로고침 버튼을 클릭하면 변경사항이 반영됩니다.

---

## 🔨 빌드 방법

### 프로덕션 빌드

```bash
npm run build
```

빌드가 완료되면 `.output/chrome-mv3` 디렉토리에 빌드 파일이 생성됩니다.

### 배포용 ZIP 파일 생성

```bash
npm run zip
```

이 명령은 다음 작업을 수행합니다:
1. 프로덕션 빌드 실행
2. `.output` 디렉토리에 배포용 ZIP 파일 생성

생성된 ZIP 파일은 Chrome Web Store에 직접 업로드할 수 있습니다.

---

## 🧪 로컬 테스트

### 빌드된 확장 프로그램 테스트

1. 프로덕션 빌드 실행:
   ```bash
   npm run build
   ```

2. Chrome에서 `chrome://extensions/` 로 이동

3. 기존 확장 프로그램이 로드되어 있다면 제거

4. "압축해제된 확장 프로그램을 로드합니다" 클릭

5. `.output/chrome-mv3` 디렉토리 선택

### 타입 체크

```bash
npm run type-check
```

TypeScript 타입 오류를 확인합니다. 커밋 전에 실행하는 것을 권장합니다.

---

## 📦 버전 관리

### 버전 업데이트 프로세스

1. **package.json 버전 업데이트**
   ```json
   {
     "version": "1.0.5"
   }
   ```

2. **변경사항 커밋**
   ```bash
   git add package.json
   git commit -m "chore: bump version to 1.0.5"
   git push origin main
   ```

### 버전 네이밍 규칙 (Semantic Versioning)

- **MAJOR (1.x.x)**: 하위 호환성이 없는 API 변경
- **MINOR (x.1.x)**: 하위 호환성이 있는 기능 추가
- **PATCH (x.x.1)**: 하위 호환성이 있는 버그 수정

---

## 🏷 GitHub 릴리즈 생성

### 자동 방법 (GitHub CLI 사용)

```bash
# 1. 태그 생성 및 푸시
git tag -a v1.0.5 -m "Release v1.0.5 - 기능 설명"
git push origin v1.0.5

# 2. GitHub 릴리즈 생성
gh release create v1.0.5 \
  --title "v1.0.5" \
  --notes "$(cat <<'EOF'
## 🎉 새로운 기능
- 새 기능 1
- 새 기능 2

## 🔧 개선 사항
- 개선 사항 1
- 개선 사항 2

## 🐛 버그 수정
- 버그 수정 1
EOF
)"
```

### 수동 방법 (GitHub 웹 UI 사용)

1. **GitHub 저장소 페이지로 이동**
   - https://github.com/4sizn/screen-saver-extension

2. **Releases 섹션 클릭**
   - 우측의 "Releases" 클릭

3. **"Draft a new release" 클릭**

4. **릴리즈 정보 입력**
   - **Tag version**: `v1.0.5` (새 태그 생성)
   - **Target**: `main` (또는 릴리즈할 브랜치)
   - **Release title**: `v1.0.5`
   - **Description**: 변경사항 작성

5. **빌드 파일 첨부 (선택사항)**
   - ZIP 파일을 드래그 앤 드롭

6. **"Publish release" 클릭**

### 릴리즈 노트 템플릿

```markdown
## 🎉 새로운 기능
- [기능 1 설명]
- [기능 2 설명]

## 🔧 개선 사항
- [개선 사항 1]
- [개선 사항 2]

## 🐛 버그 수정
- [버그 수정 1]
- [버그 수정 2]

## 📝 기타 변경사항
- [기타 변경사항]
```

---

## 🌐 Chrome Web Store 배포

### 사전 준비

1. **Chrome Web Store 개발자 계정**
   - https://chrome.google.com/webstore/devconsole
   - 계정 등록 (일회성 $5 수수료 필요)

2. **배포용 ZIP 파일 생성**
   ```bash
   npm run zip
   ```

### 배포 프로세스

#### 첫 배포 (신규 등록)

1. **Chrome Web Store Developer Dashboard 접속**
   - https://chrome.google.com/webstore/devconsole

2. **"New Item" 클릭**

3. **ZIP 파일 업로드**
   - `.output` 디렉토리의 ZIP 파일 선택

4. **Store Listing 정보 입력**

   **필수 정보:**
   - **Product name**: Screen Saver Extension
   - **Summary**: 간단한 한 줄 설명 (최대 132자)
   - **Description**: 상세한 기능 설명
   - **Category**: Productivity 또는 Tools
   - **Language**: 지원 언어 선택

   **이미지 자료:**
   - **Icon**: 128x128px (필수)
   - **Screenshots**: 1280x800px 또는 640x400px (최소 1개, 최대 5개)
   - **Promotional images** (선택사항):
     - Small tile: 440x280px
     - Marquee: 1400x560px

   **개인정보 보호:**
   - Privacy policy (필요 시)
   - Permissions justification

5. **"Submit for Review" 클릭**

6. **심사 대기**
   - 일반적으로 1-3일 소요
   - 심사 완료 후 이메일 알림

#### 업데이트 배포

1. **Developer Dashboard 접속**

2. **기존 항목 선택**

3. **"Package" 탭에서 "Upload new package" 클릭**

4. **새 ZIP 파일 업로드**

5. **변경사항이 있다면 Store Listing 업데이트**

6. **"Submit for Review" 클릭**

### 배포 체크리스트

- [ ] `package.json`의 버전이 업데이트되었는가?
- [ ] 모든 기능이 정상적으로 동작하는가?
- [ ] 타입 체크를 통과했는가? (`npm run type-check`)
- [ ] 프로덕션 빌드가 정상적으로 완료되었는가?
- [ ] ZIP 파일이 생성되었는가?
- [ ] 로컬에서 빌드된 확장 프로그램을 테스트했는가?
- [ ] GitHub에 릴리즈 태그가 생성되었는가?
- [ ] 릴리즈 노트가 작성되었는가?
- [ ] Store Listing 정보가 업데이트되었는가?

### 주의사항

1. **버전 관리**
   - Chrome Web Store의 버전은 `package.json`의 버전과 일치해야 함
   - 새 버전은 이전 버전보다 높아야 함

2. **권한 변경**
   - 새로운 권한을 추가하면 재심사가 필요하고 시간이 더 걸릴 수 있음
   - 사용자에게 권한 변경 알림이 표시됨

3. **심사 거부 사유**
   - 스크린샷과 실제 기능이 다름
   - 개인정보 보호 정책 누락 (필요한 경우)
   - 권한 남용 또는 불필요한 권한 요청
   - 악성 코드 포함

---

## 📁 프로젝트 구조

```
screen-saver-web/
├── .output/                 # 빌드 출력 디렉토리
│   └── chrome-mv3/         # Chrome MV3 빌드 파일
├── .wxt/                   # WXT 캐시 디렉토리
├── entrypoints/            # 확장 프로그램 진입점
│   ├── background.ts       # Service Worker
│   ├── content.ts          # Content Script
│   ├── options/            # 옵션 페이지
│   └── popup/              # 팝업 페이지 (미사용)
├── components/             # React 컴포넌트
├── lib/                    # 유틸리티 함수
├── public/                 # 정적 파일
│   ├── _locales/          # 다국어 파일
│   ├── icon/              # 아이콘 이미지
│   ├── images/            # 기본 이미지
│   └── sounds/            # 사운드 파일
├── wxt.config.ts          # WXT 설정
├── package.json           # 프로젝트 메타데이터
└── tsconfig.json          # TypeScript 설정
```

---

## 🚫 제한된 페이지

Chrome의 보안 정책상 일부 페이지에서는 확장 프로그램이 동작하지 않습니다.

### 제한되는 페이지 목록

다음 페이지에서는 스크린세이버가 실행되지 않습니다:

#### 제한된 프로토콜
- **chrome://** - Chrome 내부 페이지
  - 예: `chrome://extensions`, `chrome://settings`, `chrome://flags`
- **chrome-extension://** - 다른 확장 프로그램 페이지
- **edge://** - Edge 브라우저 내부 페이지
- **about:** - 브라우저 정보 페이지
- **view-source:** - 소스 보기 페이지

#### 제한된 도메인
- **chrome.google.com/webstore** - Chrome Web Store (구 URL)
- **chromewebstore.google.com** - Chrome Web Store (신 URL)
- **microsoftedge.microsoft.com/addons** - Edge 확장 프로그램 스토어
- **accounts.google.com** - Google 계정 로그인 페이지
- **myaccount.google.com** - Google 계정 관리 페이지

### 제한 사유

이러한 제한은 다음과 같은 보안상의 이유로 적용됩니다:

1. **권한 상승 방지** - 악의적인 확장 프로그램이 브라우저 설정을 변경하거나 다른 확장 프로그램을 조작하는 것을 방지
2. **사용자 인증 보호** - 로그인 페이지에서 비밀번호나 개인정보를 탈취하는 것을 방지
3. **확장 프로그램 스토어 보안** - 스토어 페이지에서 부정한 방법으로 다운로드나 리뷰를 조작하는 것을 방지

### 사용자 피드백

제한된 페이지에서는 다음과 같은 UI 피드백이 제공됩니다:

1. **아이콘 배지**: "✕" 표시 + 회색 배경색
2. **툴팁 메시지**: "스크린세이버 사용 불가 (브라우저 내부 페이지)"
3. **알림**: 아이콘 클릭 시 다음 메시지 표시
   ```
   스크린세이버 사용 불가
   브라우저 내부 페이지(chrome://, edge:// 등)에서는
   보안상의 이유로 스크린세이버를 사용할 수 없습니다.
   ```

### 구현 코드

제한된 페이지 감지 로직은 `entrypoints/background.ts`에 구현되어 있습니다:

```typescript
function isRestrictedUrl(url?: string): boolean {
  if (!url) return true;

  const restrictedProtocols = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'view-source:',
  ];

  const restrictedDomains = [
    'chrome.google.com/webstore',
    'chromewebstore.google.com',
    'microsoftedge.microsoft.com/addons',
    'accounts.google.com',
    'myaccount.google.com',
  ];

  // Check protocols
  if (restrictedProtocols.some(protocol => url.startsWith(protocol))) {
    return true;
  }

  // Check domains
  if (restrictedDomains.some(domain => url.includes(domain))) {
    return true;
  }

  return false;
}
```

### 테스트 방법

제한된 페이지 기능을 테스트하려면:

1. Chrome Web Store (`https://chromewebstore.google.com/`) 방문
2. 확장 프로그램 아이콘에 "✕" 배지가 표시되는지 확인
3. 아이콘 위에 마우스를 올려 툴팁 확인
4. 아이콘을 클릭하여 알림 메시지 확인
5. 일반 웹페이지로 이동하여 정상 동작 확인

---

## 🔍 문제 해결

### 빌드 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install

# 캐시 삭제
rm -rf .wxt
```

### 타입 오류

```bash
# TypeScript 타입 체크
npm run type-check
```

### 확장 프로그램이 로드되지 않음

1. Chrome 확장 프로그램 페이지에서 기존 확장 제거
2. 브라우저 재시작
3. 새로 빌드된 확장 프로그램 로드

### 권한 오류

`wxt.config.ts`의 `manifest.permissions`에 필요한 권한이 포함되어 있는지 확인하세요.

---

## 📚 참고 자료

- [WXT Documentation](https://wxt.dev/)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Web Store Developer Guide](https://developer.chrome.com/docs/webstore/)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)

---

## 📞 지원

이슈나 질문이 있으시면 [GitHub Issues](https://github.com/4sizn/screen-saver-extension/issues)에 등록해주세요.
