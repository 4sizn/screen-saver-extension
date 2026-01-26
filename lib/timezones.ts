export interface TimezoneOption {
  label: string;
  value: string;
}

export const TIMEZONES: TimezoneOption[] = [
  { label: '서울 (Seoul)', value: 'Asia/Seoul' },
  { label: '도쿄 (Tokyo)', value: 'Asia/Tokyo' },
  { label: '베이징 (Beijing)', value: 'Asia/Shanghai' },
  { label: '홍콩 (Hong Kong)', value: 'Asia/Hong_Kong' },
  { label: '싱가포르 (Singapore)', value: 'Asia/Singapore' },
  { label: '뉴델리 (New Delhi)', value: 'Asia/Kolkata' },
  { label: '두바이 (Dubai)', value: 'Asia/Dubai' },
  { label: '런던 (London)', value: 'Europe/London' },
  { label: '파리 (Paris)', value: 'Europe/Paris' },
  { label: '베를린 (Berlin)', value: 'Europe/Berlin' },
  { label: '뉴욕 (New York)', value: 'America/New_York' },
  { label: 'LA (Los Angeles)', value: 'America/Los_Angeles' },
  { label: '시카고 (Chicago)', value: 'America/Chicago' },
  { label: '시드니 (Sydney)', value: 'Australia/Sydney' },
  { label: '오클랜드 (Auckland)', value: 'Pacific/Auckland' },
];

export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
