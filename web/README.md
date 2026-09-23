# Lumiina Web 🎨

[![React Version](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-v13-FF0055?style=flat&logo=framer)](https://www.framer.com/motion/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Linter](https://img.shields.io/badge/Linter-Oxlint-F38020?style=flat)](https://oxc.rs)

The official web frontend for **[Lumiina](https://www.lumiina.art)** — an illustration and creator community platform designed for digital artists, illustrators, and visual art enthusiasts. Built with modern React 19, Vite 8, and TailwindCSS v4, focusing on performance, human-crafted typography, digital artist studio workflows, and zero AI-slop aesthetics.

---

## 🌟 Key Features & Studio Experience

### 1. 🖼️ Digital Artist Studio & Client-Side Resampling
- **Zero-Wait Upload Pipeline (`imageOptimizer.js`)**: Real-time client-side Canvas & GPU downsampling before sending to the backend. Resamples oversized 4K/8K illustrations to optimal 2560px display bounds, preserving razor-sharp line-art.
- **Visually Lossless WebP Compression**: Achieves **85%–95% file size reductions** (from ~15MB down to ~800KB) with zero discernible artifacting.
- **Alpha-Channel Detection**: Preserves transparency for character design sheets and digital stickers without creating black bounding boxes.
- **Value Check Mode (Grayscale)**: 1-click monochrome filter to audit light-to-shadow contrast values before publishing.
- **Feed Crop Simulator**: 1:1 square preview with top, center, and bottom focal point anchoring.
- **1:1 Native Resolution Inspector**: Fullscreen modal for pixel-level lineart and brush texture inspection.

### 2. 📇 Viral Art Showcase Card Studio (`ShareCardModal.jsx`)
- **Exhibition Placard Framing**: Generates 1080×1350 (4:5 social media ratio) cards using client-side HTML5 Canvas.
- **Human-Crafted Aesthetics**: Designed like a fine art catalog placard with clean left-aligned typography, creator handle (`@artist`), publication date, tags, and subtle `✦ LUMIINA lumiina.art` footer.
- **1-Click Export & Clipboard Copy**: Generates PNG blob directly copied to the system clipboard via `navigator.clipboard.write([new ClipboardItem(...)])` or downloaded for instant Twitter/X and Instagram sharing.

### 3. 🎨 Dominant Color Palette Studio (`PaletteStudio.jsx` & `colorExtractor.js`)
- **Sub-5ms Color Quantization**: Fast offscreen canvas downsampling (64×64) with Euclidean distance clustering. Extracts 6 dominant harmonious HEX colors without blocking the UI thread.
- **1-Click Copy**: Monospace HEX swatches with instant clipboard copy and floating tooltips.

### 4. ⚡ Global Command Palette (`CommandPalette.jsx`)
- **Omnibox Launcher**: Instant navigation triggered by `Cmd+K` / `Ctrl+K` or pressing `/`.
- **Live Debounced Search**: Fast real-time artwork search queries with smooth preview navigation.
- **Keyboard-First Experience**: Built according to Raycast & Linear interaction patterns with solid contrast and zero visual noise.

### 5. ⌨️ Power-User Keyboard Navigation (`KeyboardShortcutsModal.jsx`)
- Press **`?`** on any page to open the interactive keyboard shortcut matrix:
  - **`L`**: Toggle Like on active artwork
  - **`B`**: Toggle Bookmark collection
  - **`F`**: Toggle Zen Focus Cinema Mode
  - **`S`**: Open Showcase Card Studio modal
  - **`←` / `→`**: Navigate to previous or next artwork by the same artist
  - **`Esc`**: Close any active modal, lightbox, or focus mode

### 6. 🎬 Zen Focus Cinema Mode
- Distraction-free artwork appreciation with a solid deep theater backdrop (`#0a0d13`).
- Clean floating control bar with zoom and like toggles. Eliminates visual clutter so the artwork remains the absolute hero.

### 7. 🌸 Official Mascot & Sticker Engine (`LumiinaStickerPicker.jsx`)
- Integrated with **Lumiina Character Bible v1.0** (Creative guide mascot).
- 9 official expressive stickers (`:lumiina_1:` to `:lumiina_9:`) accessible via one-click picker in comment threads.
- High-performance WebP visual pipeline with PWA runtime caching.

### 8. 📱 Progressive Web App (PWA)
- Installable on iOS, Android, macOS, and Windows.
- Service Worker precaching with Workbox (`vite-plugin-pwa`) for offline browsing and instant loading.

---

## 🎨 Design Philosophy & Anti-AI Slop Standards

Lumiina Web strictly enforces human-crafted design guidelines:
- **No Glassmorphism Slop**: Avoids tacky blurry transparent overlays that impede legibility. Uses solid, opaque slate surfaces (`bg-white dark:bg-[#161b22]`).
- **Tactile 1px Borders**: Subtle borders (`border-slate-200 dark:border-slate-800`) provide crisp structural definition.
- **Pixiv Sky Blue Brand Accent**: High-contrast, purposeful accent color (`#0096fa`) for interactive actions.
- **Typography Hierarchy**: Content-first typography using **Inter** paired with native Japanese CJK font fallbacks (`Hiragino Sans`, `Yu Gothic UI`, `Meiryo`).
- **Zero Placeholder Data**: Realistic anime artist handles, authentic tags (`#original`, `#concept_art`, `#illustration`), and domain-native interaction patterns.

---

## 🏗️ Project Structure

```text
web/
├── public/                     # Static assets, PWA icons, SEO files
│   ├── mascot/                 # Official Lumiina mascot illustrations & expressions
│   ├── favicon.svg             # Vector site branding
│   ├── robots.txt              # Search engine crawler policies (GoogleBot, GPTBot, ClaudeBot)
│   ├── sitemap.xml             # Static root sitemap reference
│   └── llms.txt                # LLM agent context & sitemap definition
├── src/
│   ├── api/
│   │   └── client.js           # Axios instance with JWT interceptors & token refresh
│   ├── components/             # Reusable UI components
│   │   ├── ArtworkCard.jsx     # Masonry artwork card with hover overlay & like status
│   │   ├── CommandPalette.jsx  # Cmd+K global search & action modal
│   │   ├── KeyboardShortcutsModal.jsx # '?' keyboard matrix cheatsheet
│   │   ├── LumiinaStickerPicker.jsx   # Mascot expression sticker engine
│   │   ├── Navbar.jsx          # Top navigation with live search, theme toggle & user menu
│   │   ├── PaletteStudio.jsx   # Dominant color palette extractor & swatches
│   │   ├── PwaInstallBanner.jsx# Dismissible PWA install notification
│   │   ├── ShareCardModal.jsx  # 4:5 social media showcase card generator
│   │   └── ...                 # Modals, lightboxes, and loading skeletons
│   ├── context/                # Global React Context providers
│   │   ├── AuthContext.jsx     # JWT tokens, user session & auth state
│   │   ├── BookmarkContext.jsx # Bookmarked artwork IDs & toggle actions
│   │   ├── FollowContext.jsx   # Follower/following status & counts
│   │   ├── LikesContext.jsx    # Real-time artwork like tracking
│   │   └── ThemeContext.jsx    # Light / Dark mode state & persistence
│   ├── hooks/                  # Custom React hooks (PWA install, media query, debounce)
│   ├── pages/                  # Route views (code-split via React.lazy)
│   │   ├── AboutPage.jsx       # Editorial character bible & mascot turnaround
│   │   ├── ArtworkDetailPage.jsx # Full artwork view, comments, palette, cinema mode
│   │   ├── FeedPage.jsx        # Personalized home feed
│   │   ├── HomePage.jsx        # Landing discovery feed with dual carousels
│   │   ├── ProfilePage.jsx     # Artist portfolio, gallery & bookmarks
│   │   ├── RecommendedPage.jsx # Curated discovery gallery
│   │   ├── TrendingPage.jsx    # Velocity-ranked gallery
│   │   ├── UploadPage.jsx      # Artist studio upload & resampling engine
│   │   └── ...                 # Auth & legal pages
│   ├── utils/
│   │   ├── colorExtractor.js   # Fast offscreen canvas Euclidean clustering
│   │   ├── imageOptimizer.js   # Client-side Canvas/WebP downsampling
│   │   └── dateUtils.js        # Relative time & Japanese formatting
│   ├── App.jsx                 # Route definitions & Suspense boundaries
│   ├── main.jsx                # Application root mounting
│   └── index.css               # TailwindCSS v4 theme tokens & custom utilities
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite bundling, plugins & PWA manifest config
└── Dockerfile                  # Multi-stage production Nginx container
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher

### Installation
```bash
# Navigate to web directory
cd web

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
The development server will launch at `http://localhost:5173`. API requests to `/api/v1` are automatically proxied according to `VITE_API_BASE_URL` or default backend settings.

### Production Build
```bash
# Run Oxlint validation
npm run lint

# Build optimized distribution bundle
npm run build

# Preview production build locally
npm run preview
```

The output artifacts will be generated in `web/dist/`.

---

## ⚙️ Environment Variables

Create a `.env` file in the `web/` directory for local environment customization:

```env
# Backend API Base URL (Leave empty in production if using reverse proxy)
VITE_API_BASE_URL=https://www.lumiina.art/api/v1

# Cloudinary Media Base URL
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

---

## ⚡ Performance & Core Web Vitals

- **Entry Bundle Split**: Initial JavaScript bundle entry weighs **~22 kB gzip** via `React.lazy()` route splitting.
- **GPU Render Containment**: Offscreen feed cards leverage CSS `content-visibility: auto; contain-intrinsic-size: 380px;` to reduce layout thrashing on long scrolls.
- **Sub-5ms Palette Extraction**: Offscreen downsampling (64×64) ensures zero frame drops during artwork inspection.
- **Instant Client-Side Resampling**: Offloads heavy compression from servers to client GPUs, reducing upload payload sizes by up to 95%.

---

## 📄 License

Distributed under the MIT License as part of the **Lumiina** project. See [LICENSE](../LICENSE) for details.
