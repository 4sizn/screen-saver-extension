import { useState, useEffect } from 'react';

interface DigitalClockProps {
  timezone: string;
}

export function DigitalClock({ timezone }: DigitalClockProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setTime(formatter.format(now));
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [timezone]);

  return <div className="digital-clock">{time}</div>;
}

export default DigitalClock;
