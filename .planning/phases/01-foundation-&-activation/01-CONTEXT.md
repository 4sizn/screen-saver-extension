# Phase 1: Foundation & Activation - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the cross-browser extension infrastructure with basic activation/deactivation mechanics. This establishes the architectural foundation (WXT framework, React, TypeScript, Shadcn UI) and implements icon-click toggling with visual state feedback. Image display and storage are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Extension Popup UI
- 아이콘 클릭 시 팝업 없이 바로 활성화/비활성화 (no popup UI)
- 설정 페이지 접근: 우클릭 메뉴 + 브라우저 익스텐션 관리 페이지 모두 지원
- 활성화된 상태에서 아이콘 재클릭 시 바로 비활성화 (확인 팝업 없음)
- 스크린세이버 활성화 중에는 ESC로 먼저 종료해야 아이콘 접근 가능 (전체 화면 오버레이이므로 자연스러운 동작)

### Activation Feedback
- **활성화 시 피드백 (모두 제공):**
  - 즉시 전체 화면 오버레이 표시
  - 아이콘 배지 색상 변경 (회색 → 초록색)
  - 브라우저 알림 표시 (항상 - "스크린세이버 활성화됨")
  - 간단한 클릭 사운드 재생 ("딱" 소리)

- **비활성화 시 피드백:**
  - 조용히 종료 (소리, 알림 없음)
  - 오버레이가 사라지는 것만으로 충분
  - 아이콘 배지는 회색으로 복귀

### Icon Badge Design
- 상태 표시: 색상 변경 방식
- 비활성 상태: 회색 원형 도트
- 활성 상태: 초록색 원형 도트
- 배지 모양: 아이콘 오른쪽 위에 작은 원형 도트
- 위치: 브라우저 툴바의 익스텐션 아이콘

### Project Structure
- **전체 구조:** WXT 프레임워크 권장 구조 사용 (Claude가 결정)
- **React 컴포넌트:** 타입별로 조직 (components/, hooks/, utils/ 등)
- **공유 코드:** lib/ 또는 shared/ 하나의 폴더에 유틸리티와 타입 함께 모음
- **Shadcn UI:** components/ui/ 경로 사용 (Shadcn 기본 구조)

### Claude's Discretion
- WXT 프레임워크의 정확한 폴더 구조 및 entrypoints 설정
- 정확한 브라우저 알림 문구 및 스타일
- 사운드 파일 선택 및 볼륨 설정
- 배지 색상의 정확한 hex 코드 (초록색, 회색 톤)
- 오버레이 표시 시 페이드 인/아웃 애니메이션 여부
- 에러 상태 처리 및 fallback 동작

</decisions>

<specifics>
## Specific Ideas

- 아이콘 클릭은 "즉시 실행" 스타일 - 팝업이나 확인 없이 바로 토글
- 활성화는 매우 명확하게 피드백 (시각적 + 청각적 + 알림) - 사용자가 확실히 알도록
- 비활성화는 조용하게 - 이미 오버레이가 사라지므로 추가 피드백 불필요
- 배지는 미니멀하게 - 작은 원형 도트로 상태만 표시

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-&-activation*
*Context gathered: 2026-01-19*
