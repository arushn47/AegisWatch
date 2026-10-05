# AegisWatch — Design Toolchain & Improvement Map

This folder holds the canonical design language for AegisWatch.

- **[`DESIGN.md`](./DESIGN.md)** — the semantic design system (source of truth for prompting Stitch / any design tool).

This `README` maps the external design resources to **specific places in this codebase**, so the UI can be upgraded deliberately instead of bolting on trends.

---

## How to use `DESIGN.md`

`DESIGN.md` follows the Stitch "semantic design system" format: visual descriptions backed by exact hex values. When prompting Stitch (or 21st.dev, v0, Lovable) for a new screen, paste the relevant sections so generated screens inherit the tactical language instead of generic AI styling.

Keep it in sync whenever `frontend/tailwind.config.js` changes.

---

## Tool map

| Resource | What it is | Where it fits AegisWatch | Risk / cost |
|---|---|---|---|
| **[tasteskill.dev](https://www.tasteskill.dev/)** | Open-source `SKILL.md` files that stop agents generating "AI slop". Includes a **stitch-skill** with a DESIGN.md export format. | Keep this repo's `DESIGN.md` aligned with that format; use `taste-skill` when generating new screens so they don't drift generic. | None — it's an agent skill, no runtime dependency. **Highest leverage.** |
| **[21st.dev](https://21st.dev/)** | 12,000+ React/Tailwind/shadcn components, animated heroes, shaders, backgrounds. Copy a prompt or `shadcn` CLI. | Ready-made primitives for: empty states, animated hero, toast/command palette, sign-in widgets. Ideal for the "Sign in required" and feed-health states. | Low — copy-in source, but must be re-themed to our tokens (never ship their default blue). |
| **[ui.watermelon.sh](https://ui.watermelon.sh/)** | Free shadcn-based React components, **blocks, and dashboards**; exposes `llms.txt` + MCP. | Reference for dashboard composition and section blocks (e.g., KPI rows, data tables for the future analytics phase). | Low — reference-first, install selectively. |
| **[gsap.com](https://gsap.com/)** | Industry-standard timeline animation. | Choreographed entrance for the incident list, KPI count-up, and the notification drawer. GSAP gives timelines that CSS keyframes can't sequence. | Medium — adds ~50 KB; use only for a few orchestrated moments. |
| **[react-spring.dev](https://react-spring.dev/)** | Spring-physics animation for React. | Natural-feeling modal/drawer physics (the mobile nav drawer, incident detail sheet) that match touch expectations better than eased CSS. | Medium — one dependency; apply to drawers/modals only. |
| **[lenis.dev](https://lenis.dev/)** | Buttery smooth-scroll. | Optional app-like scrolling on long content pages. | ⚠️ **High risk here** — the dashboard has a Leaflet map (wheel-zoom) and inner scroll regions. Lenis would hijack them; it needs `data-lenis-prevent` on the map and every scroll container, and it fights the modal body-scroll lock. Recommend **deferring** or restricting to `/resources`. |
| **[shadergradient.co](https://shadergradient.co/)** | Animated shader gradients as a React component. | A living aurora backdrop for the app shell / loading state. | ⚠️ Heavy — pulls in `@react-three/fiber` + three.js for a decorative layer. We implemented an equivalent **CSS aurora** instead (see below) to keep the bundle lean. Revisit only if a WebGL showcase is wanted. |
| **[threeui.com](https://threeui.com/)** | Copy-ready Three.js components, WebGL backgrounds, hero sections, shaders. | A future "planetary globe" landing/hero, or a 3D globe mode for the map. | High — full Three.js stack; a distinct project, not a polish pass. |
| **[basement.studio](https://basement.studio/)** | Award-winning design studio. | **Inspiration only** — study their restraint with type scale, dark surfaces, and motion pacing. No code to install. | None. |

---

## What was applied now

**Ambient "command aurora" backdrop** — implemented natively in `frontend/src/app/globals.css` (`.aegis-aurora`) and mounted in the dashboard shell.

Rationale: it delivers the premium "living background" effect that `shadergradient`/`threeui` provide, but as GPU-cheap CSS radial blobs animated on `transform`/`opacity` — **no new dependency, no WebGL, no bundle growth**, and it respects `prefers-reduced-motion`. If a richer WebGL backdrop is later desired, the `shadergradient` route can replace it behind the same single mount point.

---

## Recommended order of adoption

1. **Sync `DESIGN.md` with tasteskill's stitch-skill format** (free, highest impact on output quality).
2. **21st.dev / Watermelon UI** for empty states, the analytics tables, and the sign-in-required card — copy source, re-theme to our tokens.
3. **react-spring** for drawer/modal physics on mobile.
4. **GSAP** for one or two orchestrated entrance sequences.
5. **Lenis / shadergradient / threeui** only with a dedicated pass and the mitigations noted above.
