# 🏹 Nockr

**A local-first, university-agnostic GPA tracker built for students who actually care about their standing.**

Track your grades per term, watch your CGPA update in real time, monitor Dean's List eligibility, and project your Latin Honors trajectory — all without an account, a server, or giving your data to anyone.

---

## Features

### Core Tracking
- **Term-based grade tracking** — add as many terms as you need, each with renamable courses
- **Live TGPA and CGPA** — computed in real time as you enter grades
- **Degree progress bar** — tracks units earned vs your total program units (editable inline)
- **Focus and Grid views** — browse one term at a time or see everything at once

### Keyboard-First Input
- `Enter` flows through course name -> units -> grade -> next course (or adds one)
- `↑ ↓` steps grades and units without touching the mouse
- `Escape` clears a grade back to ungraded

### Honors Standing
- **Dean's List badge** per term with configurable tier labels and GPA thresholds
- **Latin Honors modal** — check your projected standing on demand, not shoved in your face
- Configurable minimum unit load and minimum course grade constraints for Dean's List eligibility
- No-fail policy toggle — flags if any course grade would disqualify Latin Honors

### University Agnostic
Ships with two presets and fully customizable rules for any university:

| Preset | Scale | Direction | Failing Grade |
|---|---|---|---|
| **DLSU** | 0.0 – 4.0 | Ascending (4.0 best) | 0.0 |
| **UP** | 1.0 – 5.0 | Descending (1.0 best) | 5.0 |
| **Custom** | You decide | You decide | You decide |

Custom mode lets you define your own honor tier labels, GPA bounds, unit constraints, and policies.

### Theme System
13 built-in themes, each a fixed palette — no awkward light/dark toggle per theme:

| Dark | Light |
|---|---|
| Atom One Dark | Gruvbox Light |
| Gruvbox Dark | Rosé Pine Dawn |
| Rosé Pine | Catppuccin Latte |
| Catppuccin Mocha | Tokyo Light |
| Nord | Solarized Light |
| Dracula | |
| Tokyo Night | |
| Solarized Dark | |

Plus a fully custom 15-token palette editor if none of the presets fit.

### Aesthetic
- Aurora mesh gradient background that responds to your active theme colors
- Glassmorphic cards with specular highlights
- DM Mono for numbers and grades, Instrument Serif for the big CGPA display
- Zero flash of unstyled content — theme is applied before the first paint

### Privacy
Everything is stored in `localStorage`. No account. No backend. No analytics. Nothing leaves your browser.

---

## Planned Features

- **Unit Calculator** — "how many units of X grade can I still get before dropping out of Summa?"
- **GE Checklist** — track your general education requirements with a preset DLSU list + custom items
- **Share / Export** — generate a styled PNG card of your academic summary to share, with multiple aspect ratios (1:1, 4:5, 9:16, 16:9)

---

## Getting Started

**Prerequisites:** [Bun](https://bun.sh)

```bash
# Clone
git clone https://github.com/yourusername/nockr.git
cd nockr

# Install dependencies
bun install

# Start dev server
bun run dev
```

Then open [http://localhost:5173](http://localhost:5173).

### Other commands

```bash
bun run build       # Production build
bun run preview     # Preview production build locally
bun run check       # Run svelte-check + TypeScript
bun run lint        # ESLint
bun run format      # Prettier
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | SvelteKit + Svelte 5 Runes |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn-svelte |
| Validation | Zod |
| Icons | Lucide Svelte |
| Image Export | html2canvas *(planned)* |
| Storage | localStorage |
| Package Manager | Bun |

---

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── honors/         # Latin Honors modal
│   │   ├── layout/         # Header shell
│   │   ├── settings/       # Settings sidebar + theme picker
│   │   ├── summary/        # Academic summary card
│   │   ├── term/           # TermCard, CourseRow, TermNavigator
│   │   └── ui/             # shadcn-svelte components
│   ├── logic/
│   │   ├── gpa.ts          # TGPA, CGPA, units earned
│   │   ├── honors.ts       # Tier matching, Dean's List, Latin Honors
│   │   └── unitCalc.ts     # Projection solver
│   ├── schemas/            # Zod schemas for all data types
│   ├── stores/             # localStorage-backed Svelte store
│   ├── themes/             # Theme metadata + CSS var applicator
│   └── constants.ts        # DLSU/UP presets, GE list
└── routes/
    ├── +layout.svelte      # Theme hydration + aurora background
    ├── +page.svelte        # Main app shell
    └── layout.css          # Theme variables, glass/aurora utilities
```

---

## Data & Privacy

Nockr stores everything in your browser's `localStorage` under the key `nockr_state`. Your grades never leave your device. Clearing site data or using private/incognito mode will reset the app.

There is no sync, no backup, and no account system — intentionally. If you want to preserve your data, you may export your data via JSON file to have a local backup you can upload when your data is lost.

---

## Acknowledgements

Built for DLSU students, with functionality to support UP students and students from other universities through the custom calculator settings. The name comes from the *nock* — the notch at the end of an arrow where it meets the bowstring. Do not throw away your shot.

---

## License

GPL 3.0
