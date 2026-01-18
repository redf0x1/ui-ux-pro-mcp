# Changelog

All notable changes to UI/UX Pro MCP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.5] - 2026-01-18

### Added - New Landing Patterns
- **Row 47: Tab Navigation Component** - ARIA-compliant tabs with animated indicator, keyboard navigation
- **Row 48: Analytics Dashboard Layout** - KPI cards grid, chart widgets, responsive design
- **Row 49: Mega Menu Navigation** - Multi-column dropdown, keyboard focus management

### Enhanced - 2026 Best Practices Audit
- **Row 45 (Slider/Carousel)**: Embla/Swiper patterns, CSS scroll-snap, RTL support, prefers-reduced-motion, ARIA accessibility
- **Rows 8, 14 (Pricing)**: Framer Motion toggle animation, badge pop effect, price counter animation
- **Rows 2, 33 (Testimonials)**: Video testimonials, masonry layout, infinite marquee, lazy load avatars, platform badges
- **Rows 6, 13, 35 (Comparison Tables)**: Sticky headers with scroll shadow, feature tooltips, mobile horizontal scroll
- **Rows 9, 39 (Video Heroes)**: Lazy video with IntersectionObserver, prefers-reduced-motion fallback, poster optimization

### Research Sources
- Perplexity 2026 research: ARIA tabs (WAI-ARIA), Embla/Swiper carousels, Framer Motion pricing, Tremor dashboards, Stripe/Apple mega menus

### Summary
- Comprehensive audit of all 49 landing patterns
- 3 new critical patterns added (Tab, Dashboard, Mega Menu)
- 10 existing patterns enhanced with 2026 techniques
- Coverage: ARIA, prefers-reduced-motion, IntersectionObserver, CSS scroll-snap, RTL, keyboard navigation

## [1.1.4] - 2026-01-18

### Enhanced
- **landing.csv Row 41 (Scroll-Reactive Header)**:
  - Added explicit height transition (80px → 56px)
  - Added CSS scroll-driven animation with `animation-timeline: scroll()`
  - Added `@supports` feature detection with JS fallback

### Added
- **landing.csv Row 46**: Auto-Hiding Header pattern
  - Hide on scroll down, show on scroll up (Linear/Vercel style)
  - Direction-aware scroll tracking with `prevScrollY`
  - `requestAnimationFrame` for performance
  - 80px threshold before hiding
  
- **ux-guidelines.csv Row 129**: Header Height Transition guidelines
  - Best practice: 80px → 56px with 0.3s ease-out

- **ux-guidelines.csv Row 130**: Auto-Hide Navigation Direction
  - Direction tracking with threshold guidelines

### Updated
- **styles.csv Row 76**: Navbar Glassmorphism States
  - Added CSS `animation-timeline: scroll()` code (90%+ browser support 2026)
  - Updated era tag to "2026 Modern"

### Summary
- Deep research from Perplexity confirms 2026 best practices
- CSS scroll-driven animations now primary with JS fallback
- Auto-hiding header pattern addresses major gap

## [1.1.3] - 2026-01-18

### Fixed
- Fixed CSV parsing errors in landing.csv (rows 41, 42, 45) caused by unquoted rgba() values and comma-separated lists

## [1.1.2] - 2026-01-18

### Added
- **landing.csv**:
  - Scroll-Reactive Header (navbar scroll effect with glassmorphism)
  - Mobile Navigation Overlay (hamburger menu with slide animation)
  - Modern Footer Layout (multi-column grid, social icons, newsletter)
  - Section Dividers (wave SVG, diagonal clip-path, gradient fade)
  - Content Slider Carousel (track, dots, arrows, autoplay JS)
- **styles.csv**:
  - Navbar Glassmorphism States (component with default/scrolled/mobile states)
  - Theme Toggle (sun/moon rotation animation)
- **ux-guidelines.csv**:
  - Navbar Scroll Threshold (50-100px guidance)
  - Navbar Transition Timing (0.3-0.4s cubic-bezier)
  - Mobile Menu Animation Patterns
  - Blur-Up Image Loading effect
  - Skeleton Shimmer animation pattern
- **prompts.csv**:
  - Interactive Particle Background pattern

### Enhanced
- **styles.csv**: Glassmorphism entry updated with navbar-specific states

### Summary
- All content gaps from CryptoVault landing page test addressed
- HIGH priority: Navbar scroll, Footer patterns, Mobile menu ✅
- MEDIUM priority: Theme toggle, Slider, Image lazy, Section dividers ✅
- LOW priority: Particles, Glassmorphism states ✅

## [1.1.1] - 2026-01-18

### Fixed
- Fixed CSV parsing issues in colors.csv (escaped quotes in hex color values)
- Fixed CSV parsing issues in react.csv (escaped quotes in code examples)

## [1.1.0] - 2026-01-18

### Added

**New Features:**
- Added 3 new icon libraries: Heroicons, Phosphor Icons, Tabler Icons (+40 icons)
- Added React animation guidelines: Framer Motion (8 entries), React Spring (5 entries)
- Added AI-Native UI styles: Agentic Interface, Streaming UI, Spatial UI 3D, Voice UI
- Added CSS Scroll-Driven Animations guidelines
- Added View Transitions API guidelines for ux-guidelines.csv and nextjs.csv

**2026 Framework Updates:**
- React 19.2: Added React Compiler v1.0, Activity component, useEffectEvent hook
- Next.js 16: Added Turbopack stable, 'use cache' directive, React Compiler integration
- Tailwind v4: Added 10 new entries for CSS-first config, container queries, oklch colors

**New Color Palettes:**
- AI Code Assistant, AI Image Generator, AI Chatbot LLM
- AI Voice Platform, AI Analytics Dashboard, AI Automation Agent
- AI Video Generator, Spatial Computing/VisionOS

**New Product Types:**
- Kids/Baby/Parenting App
- Manufacturing/Industrial Platform
- Crowdfunding/Fundraising Platform

### Fixed
- Updated 19 Tailwind v4-beta URLs to stable docs
- Updated React 19 docs URLs from blog to reference docs
- Fixed Next.js version references (14+ → 15+)

### Changed
- +99 new entries across all data files
- +20 URL/reference fixes
- Total entries now: 1410+

## [1.0.1] - 2026-01-18

### Changed
- Added npm version and downloads badges to README
- Improved installation documentation with NPX, global install, and source options
- Enhanced MCP configuration examples for VS Code, Cursor, and Claude Desktop

## [1.0.0] - 2026-01-17

### Added
- Initial release with **1340+ curated design resources**
- **11 specialized search tools** for UI/UX design
- **UI Styles** (70 entries): Glassmorphism, Neumorphism, Brutalism, Bento Grid, Agentic Interface, Spatial UI, etc.
- **Color Palettes** (112 entries): Industry-specific palettes for SaaS, Fintech, Healthcare, AI/ML, Climate Tech
- **Typography** (72 entries): Modern font pairings including Geist, Satoshi, variable fonts
- **Charts** (35 types): Candlestick, Confusion Matrix, KPI Sparkline, Waterfall, etc.
- **UX Guidelines** (115 entries): Dashboard UX, AI Interface Design, WCAG 2.2, Voice UI
- **Icons** (131 entries): Lucide icons for Fintech, AI, Healthcare, E-commerce, Developer
- **Landing Pages** (40 patterns): AI Hero, Bento Grid, Pricing Calculator, Exit Intent
- **Products** (114 types): AI Assistant, Crypto/DeFi, HealthTech, Creator Economy
- **AI Prompts** (30 templates): Midjourney v7, DALL-E 3, Stable Diffusion, LLM code gen
- **Framework Guidelines** (660+ entries): React 19, Next.js 15, Vue 3.5, Svelte 5, TailwindCSS v4
- BM25 search algorithm with confidence-based domain detection
- stdio transport for VS Code/Claude Desktop integration
- HTTP/SSE transport for development and testing
- CSV-based extensible data system
