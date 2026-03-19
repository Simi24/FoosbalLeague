import { useEffect, useRef, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
};

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const AnimatedCounter = ({
  value,
  duration = 800,
  className = "",
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) => {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafId = useRef(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    const diff = to - from;

    if (diff === 0) return;

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      setDisplay(Math.round(from + diff * eased));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        prevValue.current = to;
      }
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{display}{suffix}
    </span>
  );
};
