// next/og(satori)로 렌더하는 OG 카드 마크업입니다.
// satori 제약을 따른다: 자식이 2개 이상인 컨테이너는 display:flex 명시, CSS 변수·tailwind 불가(인라인 hex),
// webp 이미지 불가(썸네일은 호출부에서 png/jpeg data URL로 변환해 넘긴다).
import Logo from "@/components/common/logo";
import { OG_COLOR, OG_SIZE } from "@/utils/og/og-assets";

interface LiveOgCardProps {
  nickname: string;
  title: string;
  isLive: boolean;
  thumbnailDataUrl: string | null;
}

// PixelPlay 브랜드 마크 — favicon(src/app/icon.svg)·PixelPlayMark와 동일 디자인(satori inline SVG).
// 다크 라운드 배경 + 민트 그라데이션 플레이 삼각형 + 픽셀 도트. hex는 favicon과 1:1 동기화된 고정값.
function PixelMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <linearGradient id="og-pixel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="#1a1f26" />
      <path d="M10 8V24L24 16L10 8Z" fill="url(#og-pixel-grad)" />
      <rect x="22" y="22" width="4" height="4" fill="#6ee7b7" />
      <rect x="18" y="22" width="2" height="2" fill="#6ee7b7" opacity="0.6" />
    </svg>
  );
}

function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <PixelMark size={32} />
      <Logo width={150} height={43} primaryColor="#ffffff" accentColor={OG_COLOR.brand} />
    </div>
  );
}

// 라이브 시청 페이지 OG — 홈 Hero를 빼닮은 카드(방송 썸네일 배경 + LIVE + 제목 + 크리에이터).
export function LiveOgCard({ nickname, title, isLive, thumbnailDataUrl }: LiveOgCardProps) {
  const safeTitle = title.length > 58 ? `${title.slice(0, 57)}…` : title;
  const initial = nickname.trim().slice(0, 1).toUpperCase() || "P";

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: OG_COLOR.bg,
      }}
    >
      {thumbnailDataUrl ? (
        <img
          src={thumbnailDataUrl}
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: `linear-gradient(135deg, ${OG_COLOR.bg} 0%, ${OG_COLOR.bgSoft} 55%, ${OG_COLOR.brand}40 100%)`,
          }}
        />
      )}

      {/* 시네마 음영(강한 비네트) — 전체 톤다운 + 위·아래 진한 검은 그림자로 썸네일을 영화관 스크린처럼
          어둑하게 가라앉힌다. satori는 자식 없는 absolute에 크기가 없으면 0×0이 되므로 width/height를 명시한다. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 26%, rgba(0,0,0,0) 48%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 34%, rgba(0,0,0,0) 60%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 48,
          left: 56,
          right: 56,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {isLive ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              backgroundColor: OG_COLOR.live,
              color: "#ffffff",
              fontSize: 26,
              fontWeight: 700,
              padding: "8px 18px",
              borderRadius: 999,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 13,
                height: 13,
                borderRadius: 999,
                backgroundColor: "#ffffff",
              }}
            />
            LIVE
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          bottom: 52,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 62,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.15,
            letterSpacing: -1,
          }}
        >
          {safeTitle}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 62,
                height: 62,
                borderRadius: 999,
                backgroundColor: OG_COLOR.brand,
                color: "#ffffff",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {initial}
            </div>
            <div
              style={{ display: "flex", fontSize: 34, fontWeight: 700, color: OG_COLOR.textMuted }}
            >
              {nickname}
            </div>
          </div>
          <Wordmark />
        </div>
      </div>
    </div>
  );
}

// 루트 폴백 카드(/og) — 공유 썸네일이 따로 없는 페이지가 상속해 쓰는 브랜드 카드.
export function BrandOgCard() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: OG_COLOR.bg,
        // Logo 카운터를 evenodd로 투명 처리했으므로 글로우가 워드마크에 닿아도 안전하다(구멍으로 배경이 비침).
        backgroundImage: `radial-gradient(circle at 50% 42%, ${OG_COLOR.brand}3a 0%, ${OG_COLOR.bg} 65%)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 30 }}>
        <PixelMark size={104} />
        <Logo width={380} height={110} primaryColor="#ffffff" accentColor={OG_COLOR.brand} />
      </div>
      <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: OG_COLOR.textMuted }}>
        화면의 최소 단위, 픽셀을 즐긴다
      </div>
    </div>
  );
}
