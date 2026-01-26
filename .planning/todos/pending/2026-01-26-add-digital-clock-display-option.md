---
created: 2026-01-26T16:39
title: Add digital clock display option to screen saver
area: ui
files:
  - entrypoints/options/App.tsx
  - entrypoints/content/overlay/App.tsx
  - lib/storage.ts
---

## Problem

현재 스크린세이버는 이미지만 표시합니다. 사용자가 스크린세이버 화면에서 현재 시간을 확인하고 싶을 때 불편합니다. 시계 표시 기능을 추가하여 사용자가 선택적으로 시간 정보를 볼 수 있도록 해야 합니다.

## Solution

**옵션 페이지 설정 UI:**
- 체크박스로 시계 표시 on/off 토글
- 체크박스 활성화 시:
  - 기본값: 사용자의 로컬 타임존 (브라우저의 `Intl.DateTimeFormat().resolvedOptions().timeZone`)
  - 드롭다운 리스트로 다른 국가/타임존 선택 가능
  - 예: "America/New_York", "Europe/London", "Asia/Seoul", "Asia/Tokyo" 등

**스토리지 스키마 추가:**
```typescript
// lib/storage.ts
export const clockEnabled = storage.defineItem<boolean>('sync:clockEnabled', {
  defaultValue: false,
});

export const clockTimezone = storage.defineItem<string>('sync:clockTimezone', {
  defaultValue: Intl.DateTimeFormat().resolvedOptions().timeZone,
});
```

**Content 오버레이 표시:**
- `entrypoints/content/overlay/App.tsx`에서 설정 로드
- clockEnabled가 true면 화면 중앙(또는 상단)에 디지털 시계 렌더링
- 1초마다 업데이트 (setInterval)
- 포맷: "HH:MM:SS" 또는 "HH:MM" (사용자 선호도에 따라 확장 가능)
- 스타일: 큰 폰트, 약간의 투명도, 이미지 위에 overlaid

**기술 스택:**
- `Intl.DateTimeFormat` API 사용하여 타임존 처리
- React useState + useEffect로 1초 interval 관리
- Tailwind로 시계 스타일링 (text-6xl, text-white, opacity-90 등)
