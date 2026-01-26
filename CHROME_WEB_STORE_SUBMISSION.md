# Chrome Web Store Submission Guide
## 제출 필수 항목 / Required Submission Items

---

## 1. Single Purpose Description (단일 목적 설명)

### English
```
This extension serves a single purpose: to provide a one-click screen saver functionality in the browser. When the user clicks the extension icon, it displays a full-screen overlay with beautiful nature images. Users can customize the screen saver with their own photos and display preferences. All features directly support this core screen saver functionality.
```

### 한국어
```
이 확장 프로그램은 브라우저에서 원클릭 스크린세이버 기능을 제공하는 단일 목적을 수행합니다. 사용자가 확장 프로그램 아이콘을 클릭하면 아름다운 자연 이미지로 전체 화면 오버레이를 표시합니다. 사용자는 자신의 사진과 디스플레이 설정으로 스크린세이버를 커스터마이징할 수 있습니다. 모든 기능은 이 핵심 스크린세이버 기능을 직접 지원합니다.
```

---

## 2. Remote Code Justification (원격 코드 사용 정당화)

### Response / 답변
```
This extension does NOT use any remote code. All code is bundled within the extension package. No external scripts, libraries, or code are loaded from remote servers.
```

```
이 확장 프로그램은 원격 코드를 사용하지 않습니다. 모든 코드는 확장 프로그램 패키지에 번들로 포함되어 있습니다. 외부 스크립트, 라이브러리 또는 코드를 원격 서버에서 로드하지 않습니다.
```

---

## 3. Host Permissions Justification (호스트 권한 정당화)

### For: `web_accessible_resources` with `matches: ['<all_urls>']`

### English
```
Host permissions are required to allow content scripts to access bundled default images (15 nature photos in images/defaults/) from IndexedDB across all tabs. The screen saver overlay needs to load these images from the extension's web_accessible_resources to display them in any browser tab where the user activates the screen saver. No data is sent to or received from external hosts.
```

### 한국어
```
호스트 권한은 콘텐츠 스크립트가 모든 탭에서 IndexedDB를 통해 번들된 기본 이미지(images/defaults/의 15개 자연 사진)에 액세스할 수 있도록 하기 위해 필요합니다. 스크린세이버 오버레이는 사용자가 스크린세이버를 활성화하는 모든 브라우저 탭에서 이러한 이미지를 표시하기 위해 확장 프로그램의 web_accessible_resources에서 이미지를 로드해야 합니다. 외부 호스트로 데이터를 전송하거나 수신하지 않습니다.
```

---

## 4. activeTab Permission Justification

### English
```
The activeTab permission is required to inject the screen saver overlay into the currently active browser tab when the user clicks the extension icon. This permission allows the extension to display the full-screen screen saver interface over the current page content. It is only used when the user explicitly activates the screen saver by clicking the extension icon.
```

### 한국어
```
activeTab 권한은 사용자가 확장 프로그램 아이콘을 클릭할 때 현재 활성 브라우저 탭에 스크린세이버 오버레이를 삽입하기 위해 필요합니다. 이 권한을 통해 확장 프로그램은 현재 페이지 콘텐츠 위에 전체 화면 스크린세이버 인터페이스를 표시할 수 있습니다. 사용자가 확장 프로그램 아이콘을 클릭하여 스크린세이버를 명시적으로 활성화할 때만 사용됩니다.
```

---

## 5. notifications Permission Justification

### English
```
The notifications permission is used to show a brief notification when the screen saver is activated, informing users that they can press ESC to deactivate it. This enhances user experience by providing clear feedback about the screen saver state and how to exit it.
```

### 한국어
```
notifications 권한은 스크린세이버가 활성화될 때 간단한 알림을 표시하여 사용자에게 ESC 키를 눌러 비활성화할 수 있음을 알리는 데 사용됩니다. 이는 스크린세이버 상태와 종료 방법에 대한 명확한 피드백을 제공하여 사용자 경험을 향상시킵니다.
```

---

## 6. storage Permission Justification

### English
```
The storage permission is required to save user preferences and settings locally in the browser. This includes display mode (cover/contain), background color, and which images are enabled/disabled. Settings are stored using chrome.storage.sync to provide a consistent experience across the user's devices. Custom uploaded images are stored in IndexedDB.
```

### 한국어
```
storage 권한은 사용자 기본 설정 및 설정을 브라우저에 로컬로 저장하기 위해 필요합니다. 여기에는 디스플레이 모드(cover/contain), 배경색, 활성화/비활성화된 이미지가 포함됩니다. 설정은 chrome.storage.sync를 사용하여 저장되어 사용자의 장치 간에 일관된 경험을 제공합니다. 커스텀 업로드 이미지는 IndexedDB에 저장됩니다.
```

---

## 7. unlimitedStorage Permission Justification

### English
```
The unlimitedStorage permission is required to prevent the browser from evicting user-uploaded custom images stored in IndexedDB due to storage quota limits. Users may upload multiple high-quality photos for their personal screen saver, and this permission ensures their image collection is preserved and not automatically deleted by the browser's quota management system.
```

### 한국어
```
unlimitedStorage 권한은 저장소 할당량 제한으로 인해 IndexedDB에 저장된 사용자 업로드 커스텀 이미지가 브라우저에 의해 제거되는 것을 방지하기 위해 필요합니다. 사용자는 개인 스크린세이버를 위해 여러 고품질 사진을 업로드할 수 있으며, 이 권한은 이미지 컬렉션이 보존되고 브라우저의 할당량 관리 시스템에 의해 자동으로 삭제되지 않도록 보장합니다.
```

---

## 8. Data Usage Certification (데이터 사용 인증)

### Statement / 선언
```
I certify that this extension uses data in compliance with the Developer Program Policy. Specifically:

- No user data is collected, transmitted, or shared with third parties
- All data (settings and images) is stored locally on the user's device
- No analytics, tracking, or telemetry is implemented
- No external API calls or network requests are made
- The extension operates entirely offline after installation
```

```
본 확장 프로그램이 개발자 프로그램 정책을 준수하는 방식으로 데이터를 사용함을 인증합니다. 구체적으로:

- 사용자 데이터를 수집, 전송 또는 제3자와 공유하지 않습니다
- 모든 데이터(설정 및 이미지)는 사용자의 장치에 로컬로 저장됩니다
- 분석, 추적 또는 원격 측정이 구현되지 않았습니다
- 외부 API 호출이나 네트워크 요청을 수행하지 않습니다
- 확장 프로그램은 설치 후 완전히 오프라인으로 작동합니다
```

---

## 9. Contact Email (연락 이메일)

### Action Required / 필요한 조치
1. Go to Chrome Web Store Developer Dashboard → Account tab
2. Enter a valid contact email address
3. Verify the email address by clicking the confirmation link sent to your inbox

### 조치 필요
1. Chrome 웹 스토어 개발자 대시보드 → 계정 탭으로 이동
2. 유효한 연락처 이메일 주소 입력
3. 받은 편지함으로 전송된 확인 링크를 클릭하여 이메일 주소 확인

---

## Privacy Policy Information

### Privacy Policy URL
If you have a hosted privacy policy, use:
```
https://github.com/4sizn/screen-saver-extension/blob/main/.planning/phases/05-polish-&-integration/PRIVACY_POLICY.md
```

Or create a simple website/GitHub Pages to host the privacy policy.

### 개인정보처리방침 URL
개인정보처리방침을 호스팅한 경우 다음을 사용하세요:
```
https://github.com/4sizn/screen-saver-extension/blob/main/.planning/phases/05-polish-&-integration/PRIVACY_POLICY.md
```

또는 개인정보처리방침을 호스팅할 간단한 웹사이트/GitHub Pages를 만드세요.

---

## Submission Checklist

- [ ] Single purpose description entered in Privacy Practices tab
- [ ] Confirmed "No" for remote code usage (or provided justification if using remote code)
- [ ] Host permissions justification provided
- [ ] activeTab permission justification provided
- [ ] notifications permission justification provided
- [ ] storage permission justification provided
- [ ] unlimitedStorage permission justification provided
- [ ] Data usage certification checked
- [ ] Contact email entered and verified
- [ ] Privacy policy URL provided (optional but recommended)
- [ ] Screenshot(s) uploaded (1280x800 or 640x400)
- [ ] Promotional tile icon uploaded (440x280)
- [ ] Detailed description written
- [ ] Short description (132 characters max) written

---

## Additional Notes

### Screenshots Recommendation
Take screenshots showing:
1. Extension icon in toolbar with screen saver active (green badge)
2. Full-screen screen saver overlay with a beautiful nature image
3. Options/settings page showing customization features
4. Image management interface (drag-and-drop reordering)

### Description Tips
- Highlight the "one-click activation" feature
- Emphasize privacy (local-only, no tracking)
- Mention the 15 included high-quality default images
- Explain custom image upload capability
- Note cross-browser compatibility
- Include keyboard shortcut (ESC to exit)

### 스크린샷 권장사항
다음을 보여주는 스크린샷 촬영:
1. 스크린세이버 활성화 상태의 툴바 확장 프로그램 아이콘(녹색 배지)
2. 아름다운 자연 이미지가 있는 전체 화면 스크린세이버 오버레이
3. 커스터마이징 기능을 보여주는 옵션/설정 페이지
4. 이미지 관리 인터페이스(드래그 앤 드롭 순서 변경)

### 설명 작성 팁
- "원클릭 활성화" 기능 강조
- 개인정보 보호 강조 (로컬 전용, 추적 없음)
- 포함된 15개의 고품질 기본 이미지 언급
- 커스텀 이미지 업로드 기능 설명
- 크로스 브라우저 호환성 언급
- 키보드 단축키 포함 (ESC로 종료)
