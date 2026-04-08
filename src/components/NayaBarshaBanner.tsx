import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  isPetal: boolean;
  wobble: number;
  wobbleSpeed: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// ── Constants ──────────────────────────────────────────────────────────────
const MB_ORANGE = "#FF6200";
const MB_ORANGE_DARK = "#CC4E00";
const MB_ORANGE_LIGHT = "#FF8533";
const MB_ORANGE_XL = "#FFB380";
const MB_WHITE = "#FFFFFF";
const MB_OFF_WHITE = "#FFF5EE";
const MB_DARK = "#1A0A00";

const PETAL_COLORS = [MB_ORANGE, MB_ORANGE_LIGHT, MB_ORANGE_XL, "#FFA040", "#FF7A1A"];

// Nepali New Year 2083 = April 14, 2026 (Nepal Standard Time UTC+5:45)
const NEW_YEAR_TARGET = new Date("2026-04-14T00:00:00+05:45");

// ── Helpers ────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");

function getTimeLeft(): TimeLeft {
  const diff = NEW_YEAR_TARGET.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function makeParticles(w: number, h: number): Particle[] {
  return Array.from({ length: 42 }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h + h,
    vx: (Math.random() - 0.5) * 0.7,
    vy: -(Math.random() * 1.3 + 0.5),
    size: Math.random() * 5 + 3,
    color: i % 8 === 0 ? MB_ORANGE_DARK : PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.07,
    alpha: Math.random() * 0.55 + 0.2,
    isPetal: i % 8 !== 0,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: Math.random() * 0.03 + 0.01,
  }));
}

// ── Sub-components ─────────────────────────────────────────────────────────
function CountBlock({ value, label }: { value: number; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "rgba(255,255,255,0.12)",
        border: "1.5px solid rgba(255,255,255,0.3)",
        borderRadius: 14,
        padding: "10px 20px",
        minWidth: 68,
        backdropFilter: "blur(8px)",
        transition: "transform 0.2s, border-color 0.2s, background 0.2s",
        cursor: "default",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.2)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.7)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.12)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.3)";
      }}
    >
      <span
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
          fontSize: 30,
          fontWeight: 700,
          color: MB_WHITE,
          lineHeight: 1,
          textShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        {pad(value)}
      </span>
      <span
        style={{
          fontSize: 9,
          letterSpacing: 2.5,
          color: "rgba(255,255,255,0.65)",
          textTransform: "uppercase",
          marginTop: 5,
          fontFamily: "'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function NayaBarshaBanner() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft());
  const [copied, setCopied] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Countdown
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  // Canvas particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
    particlesRef.current = makeParticles(canvas.width, canvas.height);
    const ctx = canvas.getContext("2d")!;

    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      particlesRef.current.forEach((p) => {
        p.x += p.vx + Math.sin(p.wobble) * 0.35;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.wobble += p.wobbleSpeed;
        if (p.y < -20) {
          p.y = canvas!.height + 20;
          p.x = Math.random() * canvas!.width;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.beginPath();
        if (p.isPetal) {
          ctx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
        }
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      });
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Ripple on click and navigate to new year sale
  const handleBannerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 900);
    
    // Navigate to new year sale page
    navigate('/new-year-sale');
  }, [navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText("BARSHA2083").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShop = () => {
    navigate('/new-year-sale');
  };

  return (
    <>
      <style>{`
        @keyframes mbFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mbPulse {
          0%,100% { opacity:1; transform: scale(1); }
          50%      { opacity:0.4; transform: scale(0.85); }
        }
        @keyframes mbBgBreath {
          0%   { filter: brightness(1); }
          100% { filter: brightness(1.12); }
        }
        @keyframes mbRipple {
          to { transform: scale(5); opacity: 0; }
        }
        @keyframes mbShimmer {
          0%   { left: -60%; }
          100% { left: 160%; }
        }
        @keyframes mbFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-6px); }
        }

        .mb-btn-primary { position: relative; overflow: hidden; }
        .mb-btn-primary::after {
          content: '';
          position: absolute;
          top: -50%; left: -60%;
          width: 40%; height: 200%;
          background: rgba(255,255,255,0.4);
          transform: skewX(-20deg);
          animation: mbShimmer 2.8s ease-in-out infinite;
        }
        .mb-ripple {
          position: absolute;
          border-radius: 50%;
          width: 60px; height: 60px;
          margin-left: -30px; margin-top: -30px;
          background: rgba(255,255,255,0.2);
          transform: scale(0);
          animation: mbRipple 0.9s linear forwards;
          pointer-events: none;
        }
      `}</style>

      <div
        ref={bannerRef}
        onClick={handleBannerClick}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "100%",
          height: 360,
          borderRadius: 0,
          overflow: "hidden",
          cursor: "pointer",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
          userSelect: "none",
          margin: "0 auto",
        }}
      >
        {/* Animated background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${MB_ORANGE_DARK} 0%, ${MB_ORANGE} 45%, ${MB_ORANGE_LIGHT} 80%, #FFA040 100%)`,
            animation: "mbBgBreath 5s ease-in-out infinite alternate",
          }}
        />

        {/* Subtle pattern overlay — diagonal stripes */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 28px)",
          }}
        />

        {/* Canvas particles */}
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

        {/* Ripples */}
        {ripples.map((r) => (
          <div
            key={r.id}
            className="mb-ripple"
            style={{ left: r.x, top: r.y, zIndex: 4 }}
          />
        ))}

        {/* Decorative border - Hidden on horizontal layout */}
        <div
          style={{
            position: "absolute",
            inset: 10,
            border: "1.5px solid rgba(255,255,255,0.28)",
            borderRadius: 16,
            pointerEvents: "none",
            zIndex: 2,
            display: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 5,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
            }}
          />
        </div>

        {/* Corner ornaments - Hidden on horizontal layout */}
        {(["tl", "tr", "bl", "br"] as const).map((pos) => (
          <svg
            key={pos}
            viewBox="0 0 50 50"
            width={44}
            height={44}
            style={{
              position: "absolute",
              top: pos.startsWith("t") ? 16 : undefined,
              bottom: pos.startsWith("b") ? 16 : undefined,
              left: pos.endsWith("l") ? 16 : undefined,
              right: pos.endsWith("r") ? 16 : undefined,
              transform: pos === "tr" ? "scaleX(-1)" : pos === "bl" ? "scaleY(-1)" : pos === "br" ? "scale(-1)" : undefined,
              zIndex: 3,
              display: "none",
            }}
          >
            <path d="M2 2 L2 20 M2 2 L20 2" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 2 Q8 8 2 8" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
            <circle cx="2" cy="2" r="3" fill={MB_WHITE} />
            <circle cx="20" cy="2" r="1.5" fill={MB_WHITE} fillOpacity={0.5} />
            <circle cx="2" cy="20" r="1.5" fill={MB_WHITE} fillOpacity={0.5} />
          </svg>
        ))}

        {/* MulyaBazzar logo mark (top-left inside border) - Hidden on horizontal layout */}
        <div
          style={{
            position: "absolute",
            top: 26,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5,
            display: "none",
            alignItems: "center",
            gap: 8,
            animation: "mbFadeUp 0.6s ease forwards",
          }}
        >
        </div>

        {/* Main content */}
        <div
          style={{
            position: "relative",
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "20px 48px",
            textAlign: "center",
            gap: 0,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.45)",
              borderRadius: 100,
              padding: "4px 14px",
              marginBottom: 8,
              backdropFilter: "blur(8px)",
              animation: "mbFadeUp 0.7s ease 0.1s both",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: MB_WHITE, animation: "mbPulse 1.8s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2, color: MB_WHITE, textTransform: "uppercase", fontFamily: "'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif" }}>
              नेपाल सम्वत् २०८३ · Naya Barsha 2083
            </span>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: MB_WHITE, animation: "mbPulse 1.8s ease-in-out 0.9s infinite" }} />
          </div>

          {/* Nepali heading */}
          <h1
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
              fontSize: 38,
              color: MB_WHITE,
              lineHeight: 1.05,
              textShadow: "0 4px 24px rgba(0,0,0,0.25)",
              animation: "mbFadeUp 0.8s ease 0.25s both",
              margin: 0,
              fontWeight: 700,
            }}
          >
            नयाँ वर्षको शुभकामना
          </h1>

          <p
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
              fontSize: 10,
              letterSpacing: 2,
              color: "rgba(255,255,255,0.8)",
              textTransform: "uppercase",
              marginTop: 4,
              marginBottom: 0,
              animation: "mbFadeUp 0.8s ease 0.4s both",
              fontWeight: 600,
            }}
          >
            Happy New Year · Shubhakamana
          </p>

          {/* Sale % — floating animation */}
          <div
            style={{
              marginTop: 8,
              animation: "mbFadeUp 0.9s ease 0.55s both",
            }}
          >
            <div
              style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
                fontSize: 48,
                fontWeight: 900,
                color: MB_WHITE,
                lineHeight: 0.9,
                textShadow: "0 8px 32px rgba(0,0,0,0.22)",
                animation: "mbFloat 4s ease-in-out infinite",
              }}
            >
              UP TO <span style={{ fontStyle: "italic", color: MB_OFF_WHITE }}>40%</span> OFF
            </div>
            <p
              style={{
                fontSize: 9,
                letterSpacing: 2,
                color: "rgba(255,255,255,0.65)",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              Storewide · Limited Time · All Categories
            </p>
          </div>

          {/* Divider */}
          <div
            style={{
              display: "none",
              alignItems: "center",
              gap: 14,
              width: "100%",
              maxWidth: 520,
              margin: "20px 0",
              animation: "mbFadeUp 0.9s ease 0.7s both",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }} />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}>❈</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }} />
          </div>

          {/* Countdown */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              animation: "mbFadeUp 0.9s ease 0.85s both",
            }}
          >
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <CountBlock
                key={unit}
                value={timeLeft[unit]}
                label={unit === "minutes" ? "Mins" : unit.charAt(0).toUpperCase() + unit.slice(1)}
              />
            ))}
          </div>

          {/* CTA buttons */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
              animation: "mbFadeUp 0.9s ease 1s both",
            }}
          >
            <button
              className="mb-btn-primary"
              onClick={(e) => { e.stopPropagation(); handleShop(); }}
              style={{
                background: MB_WHITE,
                color: MB_ORANGE,
                border: "none",
                borderRadius: 50,
                padding: "10px 24px",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                cursor: "pointer",
                textTransform: "uppercase",
                boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px) scale(1.03)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0) scale(1)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(0,0,0,0.2)";
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px) scale(1.03)"; }}
            >
              🛍️ Shop the Sale
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
