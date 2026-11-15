# FER — full UI redesign plan

## 1. Audit (what is wrong today)

**Visual identity**
- Three different design languages: the newer homepage (teal, Space Grotesk, mono labels), the older pages (Inter, pure black/white, heavy shadows) and the admin panel (its own styles).
- Generic "AI template" tells: mono uppercase eyebrows on every section, a two-colour headline on every section, icon-in-a-black-square cards, a gradient CTA slab, centred "About Us" hero with an info icon.
- "FER" set in plain text with no logo.

**Layout bugs**
- About stats: labels overflow their cards ("Accurac", "Imag Proce").
- Image Analyses stats: "Avg Confidence" spills outside its card.
- Profile: "0h 0m 0s" breaks across three lines; there are two logout buttons, one wedged between sections.
- Dashboard: the first card sits out of line with the other two, and a large empty area sits below the cards.
- Detection: a centred title fights the back button, the "API Ready" pill is misaligned, and there is an empty divider block.
- Login/Signup: the black icon tile, a hard-edged shadow blob and a left-aligned button inside a centred card.

**User journey**
- The logged-in tools sit inside the marketing navbar and footer, with no app navigation.
- The footer links (FAQs, Testimonials, Team) point nowhere.
- A splash screen delays the first visit.
- The dashboard is just three links and shows no data.
- Camera and photo are hidden behind tabs, and the info panel duplicates the homepage.
- There is no 404 page, and pages don't change their document title.

**Functional bugs**
- Readings labelled Angry or Surprised are rejected by the database, which expects `Anger`/`Surprise`, so they are silently never saved.
- The detection loop reads stale React state, so several detections can run at once.
- Admin: create user, change role, reset password, delete user and check-online call backend routes that don't exist.
- `/api/users/profile` and the admin user list send bcrypt password hashes to the browser.

## 2. Direction

**Brand: FER, emotion recognition.** A new logomark: a rounded "viewfinder" square with three landmark dots forming a face. It is used in the nav, the favicon and the report export.

**Look:** "lab instrument", calm and precise.
- Colours:
  - warm paper (`#F4F3EF`) and ink (`#111214`)
  - one cobalt signal colour (`#3346FF` light, `#8391FF` dark)
  - a seven-colour emotion spectrum, used only for data
- Type: Schibsted Grotesk for headings, Instrument Sans for body text, Geist Mono only for numbers and readouts.
- Dropped: mono eyebrows, gradient slabs, two-colour headlines and icon tiles.
- Kept: generous whitespace, hairline rules and real product UI as the visuals.
- Dark mode is a full token swap. It follows the device setting by default, has a toggle, and doesn't flash on load.

**Motion:**
- route transitions (fade and 8px rise)
- scroll reveals (once only)
- live bars that move smoothly
- the viewfinder corners lock onto the detected face
- all of it respects reduced-motion settings

## 3. Information architecture

**Public site (marketing nav and footer)**
- `/`: hero with a working live demo, how it works, the seven expressions, privacy, use cases, CTA
- `/about`: story, principles, the model and stack, the team
- `/contact`: form and details
- `/login`, `/signup`, `/admin/login`: split auth layout (form plus product panel)
- `*`: 404 page

**App (own shell: sidebar on desktop, bottom tab bar on mobile, no marketing footer)**
- `/dashboard` (Overview):
  - greeting and quick actions
  - 24-hour readings
  - dominant expression and distribution
  - a timeline chart
  - recent sessions and recent photos
- `/emotion-detection` (Detect), with Live camera and Photo modes kept in the URL (`?mode=photo`):
  - live: viewfinder with a face box, live bars, a session timeline and a session summary
  - photo: drag, drop, paste, URL or multiple files; a queue; and a result card with report export
- `/image-analyses` (History): a filterable grid, a detail drawer, delete and export
- `/profile` (Account): profile edit, activity and login history
- `/admin/dashboard` (Admin): overview, users (create, role, reset password, delete, detail drawer), messages and subscribers

## 4. Build steps

1. Design tokens, base styles and UI primitives: button, field, card, badge, segmented control, stat and empty state.
2. Shared parts: Logo, ThemeToggle, SiteNav, SiteFooter, AppShell, page transitions, Reveal, EmotionBars, the emotion helpers, auth helpers and RequireAuth.
3. Rewrite every page on the new system and delete the old section components and CSS.
4. Fix the functional bugs: map emotion labels, use ref-based detection, add the missing admin routes, and strip password hashes from responses.
5. Seed the demo account with realistic history so Overview and History aren't empty.
6. QA:
   - every page at 390 px and 1440 px, in light and dark
   - check for console errors, overlap and tap-target size
   - an end-to-end flow: sign up, detect, save, history, delete, profile edit, admin
7. Deploy the frontend and API, then push to `cloudflare-revamp`.
