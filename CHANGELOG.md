# Changelog

All notable changes to UI/UX Pro MCP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
