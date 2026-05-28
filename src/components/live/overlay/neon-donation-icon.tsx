"use client";

// 후원 알림 오버레이의 기본 네온 SVG 아이콘을 렌더링합니다.
import { motion } from "motion/react";

export function NeonDonationIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 380 300" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <defs>
        <filter id="pixelplayDonationNeonGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="pixelplayDonationHardGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
          <feColorMatrix
            in="blur"
            result="glow"
            type="matrix"
            values="0 0 0 0 0.18 0 0 0 0 1 0 0 0 0 0.62 0 0 0 1 0"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="pixelplayDonationSoftGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <linearGradient id="pixelplayDonationBodyFront" x1="106" x2="260" y1="48" y2="248">
          <stop offset="0%" stopColor="#1e6a70" />
          <stop offset="38%" stopColor="#0b2534" />
          <stop offset="72%" stopColor="#102c34" />
          <stop offset="100%" stopColor="#15523f" />
        </linearGradient>
        <linearGradient id="pixelplayDonationBodyLeft" x1="58" x2="132" y1="58" y2="248">
          <stop offset="0%" stopColor="#29d58e" />
          <stop offset="32%" stopColor="#12666c" />
          <stop offset="100%" stopColor="#081f25" />
        </linearGradient>
        <linearGradient id="pixelplayDonationBodyTop" x1="96" x2="250" y1="18" y2="86">
          <stop offset="0%" stopColor="#7dffd0" />
          <stop offset="36%" stopColor="#22c886" />
          <stop offset="68%" stopColor="#0c5261" />
          <stop offset="100%" stopColor="#071b27" />
        </linearGradient>
        <linearGradient id="pixelplayDonationInnerGlass" x1="116" x2="236" y1="82" y2="220">
          <stop offset="0%" stopColor="#0e394a" />
          <stop offset="48%" stopColor="#081723" />
          <stop offset="100%" stopColor="#0a392f" />
        </linearGradient>
        <linearGradient id="pixelplayDonationCoin" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#d8ffe8" />
          <stop offset="28%" stopColor="#5fffb1" />
          <stop offset="65%" stopColor="#11a968" />
          <stop offset="100%" stopColor="#07533f" />
        </linearGradient>
        <linearGradient id="pixelplayDonationCoinDark" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#56f5a6" />
          <stop offset="100%" stopColor="#0b5c4c" />
        </linearGradient>
        <radialGradient id="pixelplayDonationCoinShine" cx="36%" cy="24%" r="76%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.88" />
          <stop offset="20%" stopColor="#c9ffe2" stopOpacity="0.62" />
          <stop offset="58%" stopColor="#34d399" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
        </radialGradient>
      </defs>

      <motion.g
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 8, delay: 0.06 }}
        filter="url(#pixelplayDonationNeonGlow)"
      >
        <ellipse
          cx="180"
          cy="258"
          rx="112"
          ry="18"
          fill="#000"
          opacity="0.24"
          filter="url(#pixelplayDonationSoftGlow)"
        />
        <motion.g
          animate={{ opacity: [0.18, 0.38, 0.18], scale: [0.96, 1.04, 0.96] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path
            d="M72 74 122 30 214 20 276 64 304 120 290 206 222 266 106 250 48 192Z"
            fill="#46c6a9"
            opacity="0.24"
            filter="url(#pixelplayDonationSoftGlow)"
          />
        </motion.g>

        <path
          d="M116 36 216 22 276 62 302 118 292 200 222 262 106 244 50 190 50 92Z"
          fill="#06212b"
          opacity="0.88"
        />
        <path
          d="M116 36 156 64 50 92 50 190 106 244 106 114Z"
          fill="url(#pixelplayDonationBodyLeft)"
          stroke="#7dffd0"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <path
          d="M116 36 216 22 276 62 156 64Z"
          fill="url(#pixelplayDonationBodyTop)"
          stroke="#a7ffd1"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <path
          d="M156 64 276 62 302 118 292 200 222 262 106 244 106 114Z"
          fill="url(#pixelplayDonationBodyFront)"
          stroke="#7dffd0"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M132 120 170 82 246 82 274 124 266 184 216 228 134 214 88 168 88 126Z"
          fill="url(#pixelplayDonationInnerGlass)"
          stroke="#67e8f9"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path
          d="M148 130 178 98 232 100 252 130 248 174 212 204 150 194 116 160 116 132Z"
          fill="none"
          stroke="#6dffb7"
          strokeWidth="4.5"
          strokeLinejoin="round"
          opacity="0.96"
        />
        <path
          d="M166 136 190 112 222 116 236 138 234 166 208 186 172 180 150 158Z"
          fill="none"
          stroke="#34d399"
          strokeWidth="2.8"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <path
          d="M76 118H102M80 136H112M86 154H106M70 174H100M78 92v26M94 84v18M246 112h20M252 128h26M240 146h22M250 164v24M232 186v22M174 106v30h-24M166 196v18M130 86l-20 24v30M214 90l20 22"
          fill="none"
          stroke="#4ade80"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M84 204H114M92 218H126M272 150v34M286 130v44M136 228 164 204M210 238 230 214M178 88h44M184 76h68"
          fill="none"
          stroke="#67e8f9"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.76"
        />
        <circle cx="76" cy="118" r="3.5" fill="#6dffb7" />
        <circle cx="94" cy="84" r="3.5" fill="#6dffb7" />
        <circle cx="266" cy="112" r="3.5" fill="#6dffb7" />
        <circle cx="166" cy="214" r="3.5" fill="#6dffb7" />
        <circle cx="250" cy="188" r="3.5" fill="#6dffb7" />
        <circle cx="130" cy="86" r="3.5" fill="#6dffb7" />
        <circle cx="222" cy="88" r="3.5" fill="#67e8f9" />
        <path
          d="M130 46 204 38 238 56 220 76 150 78Z"
          fill="#071a1f"
          stroke="#75ffd0"
          strokeWidth="3"
          strokeLinejoin="round"
          opacity="0.82"
        />
        <path
          d="M154 78 218 76 206 98 166 100Z"
          fill="#0d514a"
          stroke="#75ffd0"
          strokeWidth="3"
          strokeLinejoin="round"
          opacity="0.78"
        />
        <path
          d="M116 36 156 64 276 62M50 92 106 114 156 64M106 244 134 214M222 262 216 228M302 118 274 124"
          fill="none"
          stroke="#b7ffd8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.72"
        />
        <motion.path
          d="M178 136 212 156 178 176Z"
          fill="none"
          stroke="#d1fae5"
          strokeWidth="8"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#pixelplayDonationHardGlow)"
          animate={{ y: [0, -7, 0, -3, 0], scale: [1, 1.04, 1, 1.02, 1] }}
          transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8 }}
        />
        <path
          d="M156 154c10-8 30-13 52-4M156 186c14 8 34 8 54-2"
          fill="none"
          stroke="#6dffb7"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.78"
        />

        <motion.g
          animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 2.25, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "284px 156px" }}
        >
          <ellipse
            cx="286"
            cy="158"
            rx="44"
            ry="36"
            fill="url(#pixelplayDonationCoin)"
            stroke="#a7ffd1"
            strokeWidth="5"
          />
          <ellipse
            cx="286"
            cy="158"
            rx="32"
            ry="25"
            fill="none"
            stroke="#d1fae5"
            strokeWidth="2.4"
            opacity="0.72"
          />
          <path
            d="M253 150 268 126 306 132 326 154 314 184 278 190"
            fill="url(#pixelplayDonationCoinShine)"
            opacity="0.82"
          />
          <path
            d="M272 134 308 158 272 182Z"
            fill="none"
            stroke="#eafff4"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
          <path
            d="M254 148 272 122 308 132M258 170 282 190 320 166"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.42"
          />
        </motion.g>

        <motion.g
          animate={{ y: [0, 7, 0], x: [0, -3, 0] }}
          transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity, delay: 0.2 }}
        >
          <ellipse
            cx="232"
            cy="210"
            rx="24"
            ry="18"
            fill="url(#pixelplayDonationCoinDark)"
            stroke="#9fffcf"
            strokeWidth="4"
          />
          <path d="M224 198 244 210 224 222Z" fill="none" stroke="#eafff4" strokeWidth="3" />
        </motion.g>

        <motion.g
          animate={{ y: [0, -5, 0], x: [0, 4, 0] }}
          transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        >
          <ellipse
            cx="296"
            cy="244"
            rx="30"
            ry="22"
            fill="url(#pixelplayDonationCoinDark)"
            stroke="#9fffcf"
            strokeWidth="4"
          />
          <path d="M286 230 310 244 286 258Z" fill="none" stroke="#eafff4" strokeWidth="4" />
        </motion.g>
      </motion.g>
    </svg>
  );
}
