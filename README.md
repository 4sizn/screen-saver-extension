# Screen Saver Browser Extension

> Instant, one-click screen saver activation in any browser tab with beautiful nature imagery and personal customization.

[English](#english) | [한국어](#korean)

---

<a name="english"></a>

## Features

- **One-Click Activation**: Click the extension icon to instantly activate a full-screen screen saver
- **15 Beautiful Default Images**: Curated high-quality nature landscape photographs from Unsplash (1920x1080)
- **Custom Image Upload**: Add your own photos with automatic compression and optimization
- **Display Settings**: Choose between Cover (fill screen) or Contain (preserve aspect ratio) fit modes
- **Background Color**: Customize the background color visible in Contain mode
- **Image Management**: Enable/disable, reorder, and delete custom images
- **Per-Tab State**: Independent screen saver state for each browser tab
- **Keyboard Shortcut**: Press ESC to deactivate
- **Cross-Browser**: Works identically on Chrome, Firefox, and Microsoft Edge

## Installation

### Chrome Web Store
1. Visit [Chrome Web Store](#) (link will be added after publication)
2. Click "Add to Chrome"
3. Click extension icon to activate screen saver

### Firefox Add-ons
1. Visit [Firefox Add-ons](#) (link will be added after publication)
2. Click "Add to Firefox"
3. Click extension icon to activate screen saver

### Microsoft Edge Add-ons
1. Visit [Microsoft Edge Add-ons](#) (link will be added after publication)
2. Click "Get"
3. Click extension icon to activate screen saver

## Usage

### Basic Usage
1. **Activate**: Click the extension icon in your browser toolbar
   - Full-screen overlay appears with a random nature image
   - Badge turns green to indicate active state
   - Notification confirms activation
2. **Deactivate**: Press ESC key or click the extension icon again
   - Overlay disappears
   - Badge turns gray to indicate inactive state

### Customization
1. **Access Settings**: Right-click extension icon → Options (or visit extension settings)
2. **Upload Custom Images**:
   - Click "Choose Image" button
   - Select JPEG, PNG, or WebP (max 10MB)
   - Images are automatically compressed to ~500KB
3. **Configure Display**:
   - **Cover**: Image fills entire screen (may crop)
   - **Contain**: Image preserves aspect ratio (shows background color)
   - Choose background color for Contain mode
4. **Manage Images**:
   - Toggle individual images on/off
   - Drag to reorder
   - Delete custom images (default images cannot be deleted)

## For Developers

### Prerequisites
- Node.js 18+
- npm or pnpm

### Setup
```bash
# Clone repository
git clone https://github.com/4sizn/screen-saver-extension.git
cd screen-saver-extension

# Install dependencies
npm install

# Run development mode
npm run dev

# Build for production
npm run build

# Generate browser-specific packages
npm run zip      # or: wxt zip
```

### Development Mode
```bash
npm run dev
```
Then load the extension:
- **Chrome/Edge**: `chrome://extensions` → Load unpacked → `.output/chrome-mv3/`
- **Firefox**: `about:debugging` → Load Temporary Add-on → `.output/firefox-mv2/manifest.json`

### Tech Stack
- **Framework**: [WXT](https://wxt.dev/) - Cross-browser extension framework
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: Shadcn UI (Button, Card, Switch, Label)
- **Storage**: IndexedDB (native API) + chrome.storage.sync
- **Image Processing**: browser-image-compression
- **Drag & Drop**: @dnd-kit

### Project Structure
```
screen-saver-extension/
├── entrypoints/
│   ├── background.ts           # Service worker (activation logic)
│   ├── content/                # Content script (overlay UI)
│   └── options/                # Settings page
├── lib/
│   ├── imageStorage.ts         # IndexedDB image management
│   ├── settingsStorage.ts      # Settings persistence
│   ├── imageProcessing.ts      # Image compression utilities
│   └── messages.ts             # Background ↔ Content messaging
├── components/ui/              # Shadcn UI components
└── public/
    └── images/defaults/        # 15 bundled Unsplash images
```

### Build Output
```bash
.output/
├── chrome-mv3/                 # Chrome/Edge build
├── firefox-mv2/                # Firefox build
└── *.zip                       # Distribution packages
```

## Privacy

This extension operates entirely **locally** in your browser:
- ✅ **No data collection** - No analytics, tracking, or telemetry
- ✅ **No external servers** - All data stored locally in IndexedDB
- ✅ **No network requests** - Default images bundled, no external API calls
- ✅ **No user tracking** - No cookies, no fingerprinting

**Permissions explained:**
- `storage`: Save your settings and uploaded images locally
- `notifications`: Show activation confirmation
- `activeTab`: Display screen saver overlay on current tab
- `unlimitedStorage`: Store your custom images without quota limits

See [PRIVACY_POLICY.md](.planning/phases/05-polish-&-integration/PRIVACY_POLICY.md) for full details.

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 88+ | ✅ Fully Supported (Manifest V3) |
| Firefox | 109+ | ✅ Fully Supported (Manifest V2) |
| Microsoft Edge | 88+ | ✅ Fully Supported (Manifest V3) |
| Safari | - | ⏳ Planned (requires macOS build environment) |

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

- **Issues**: [GitHub Issues](https://github.com/4sizn/screen-saver-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/4sizn/screen-saver-extension/discussions)

---

<a name="korean"></a>

## 한국어

### 소개

원클릭으로 브라우저에서 아름다운 스크린세이버를 활성화할 수 있는 확장 프로그램입니다. 15개의 고품질 자연 풍경 사진이 기본 제공되며, 자신만의 이미지를 업로드하여 사용할 수 있습니다.

### 주요 기능

- **원클릭 활성화**: 확장 프로그램 아이콘을 클릭하면 즉시 전체 화면 스크린세이버 실행
- **15개 기본 이미지**: Unsplash의 고품질 자연 풍경 사진 (1920x1080) 제공
- **커스텀 이미지 업로드**: 자신의 사진을 추가하면 자동으로 압축 및 최적화
- **디스플레이 설정**: Cover (화면 채우기) 또는 Contain (비율 유지) 모드 선택
- **배경색 설정**: Contain 모드에서 보이는 배경색 커스터마이징
- **이미지 관리**: 개별 이미지 활성화/비활성화, 순서 변경, 삭제 가능
- **탭별 독립 상태**: 각 브라우저 탭마다 독립적인 스크린세이버 상태
- **키보드 단축키**: ESC 키로 비활성화
- **크로스 브라우저**: Chrome, Firefox, Microsoft Edge에서 동일하게 작동

### 설치 방법

#### Chrome 웹 스토어
1. [Chrome 웹 스토어](#) 방문 (출시 후 링크 추가 예정)
2. "Chrome에 추가" 클릭
3. 확장 프로그램 아이콘 클릭하여 스크린세이버 활성화

#### Firefox 부가 기능
1. [Firefox 부가 기능](#) 방문 (출시 후 링크 추가 예정)
2. "Firefox에 추가" 클릭
3. 확장 프로그램 아이콘 클릭하여 스크린세이버 활성화

#### Microsoft Edge 추가 기능
1. [Microsoft Edge 추가 기능](#) 방문 (출시 후 링크 추가 예정)
2. "받기" 클릭
3. 확장 프로그램 아이콘 클릭하여 스크린세이버 활성화

### 사용 방법

#### 기본 사용법
1. **활성화**: 브라우저 툴바의 확장 프로그램 아이콘 클릭
   - 랜덤 자연 이미지로 전체 화면 오버레이 표시
   - 배지가 녹색으로 변경 (활성 상태)
   - 알림으로 활성화 확인: "스크린세이버 활성화 / ESC 키를 눌러 종료하세요."
2. **비활성화**: ESC 키 누르기 또는 확장 프로그램 아이콘 다시 클릭
   - 오버레이 사라짐
   - 배지가 회색으로 변경 (비활성 상태)

#### 커스터마이징
1. **설정 접근**: 확장 프로그램 아이콘 우클릭 → 옵션
2. **커스텀 이미지 업로드**:
   - "Choose Image" 버튼 클릭
   - JPEG, PNG, WebP 선택 (최대 10MB)
   - 이미지 자동 압축 (~500KB)
3. **디스플레이 설정**:
   - **Cover**: 화면 전체 채우기 (이미지 잘릴 수 있음)
   - **Contain**: 비율 유지 (배경색 표시)
   - Contain 모드 배경색 선택
4. **이미지 관리**:
   - 개별 이미지 활성화/비활성화 토글
   - 드래그하여 순서 변경
   - 커스텀 이미지 삭제 (기본 이미지는 삭제 불가)

### 개발자 정보

#### 개발 환경 설정
```bash
# 저장소 복제
git clone https://github.com/4sizn/screen-saver-extension.git
cd screen-saver-extension

# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 프로덕션 빌드
npm run build

# 브라우저별 패키지 생성
npm run zip
```

### 개인정보 보호

이 확장 프로그램은 **완전히 로컬**에서 작동합니다:
- ✅ **데이터 수집 없음** - 분석, 추적, 원격 측정 없음
- ✅ **외부 서버 없음** - 모든 데이터는 IndexedDB에 로컬 저장
- ✅ **네트워크 요청 없음** - 기본 이미지 번들 포함, 외부 API 호출 없음
- ✅ **사용자 추적 없음** - 쿠키, 핑거프린팅 없음

### 브라우저 호환성

| 브라우저 | 버전 | 상태 |
|---------|------|------|
| Chrome | 88+ | ✅ 완전 지원 |
| Firefox | 109+ | ✅ 완전 지원 |
| Microsoft Edge | 88+ | ✅ 완전 지원 |
| Safari | - | ⏳ 계획 중 |

### 라이선스

MIT License

### 문의

- **이슈**: [GitHub Issues](https://github.com/4sizn/screen-saver-extension/issues)
- **토론**: [GitHub Discussions](https://github.com/4sizn/screen-saver-extension/discussions)

---

Made with ❤️ by [4sizn](https://github.com/4sizn)
