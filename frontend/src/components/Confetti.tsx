import { useEffect, useState } from "react";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#ffd740", "#ffffff", "#60a5fa"];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

const generateParticles = (count: number): Particle[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -(Math.random() * 20 + 10),
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    size: Math.random() * 6 + 4,
    rotation: Math.random() * 360,
    delay: Math.random() * 300,
  }));

type ConfettiProps = {
  active: boolean;
  duration?: number;
  particleCount?: number;
};

export const Confetti = ({ active, duration = 2500, particleCount = 40 }: ConfettiProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;

    setParticles(generateParticles(particleCount));
    const timer = setTimeout(() => setParticles([]), duration);
    return () => clearTimeout(timer);
  }, [active, duration, particleCount]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-[confettiFall_2s_ease-in_forwards]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
            borderRadius: "2px",
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}ms`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
};
