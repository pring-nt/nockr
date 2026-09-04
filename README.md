# 🏹 Nockr

A GPA tracker for university students. No account, no backend, no data leaves your browser.

> **Disclaimer:** Nockr is an independent student project and is not affiliated with, endorsed by, or connected to De La Salle University, the University of the Philippines, the University of Santo Tomas, Ateneo de Manila University, or any other academic institution. University presets are community-sourced approximations — always verify your institution's official policies.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data & Privacy](#data--privacy)
- [Contributing](#contributing)
    - [Commit Convention](#commit-convention)
    - [Branching Convention](#branching-convention)
- [License](#license)

---

## Features

### Core Tracking
- Term-based grade entry with live TGPA and CGPA
- Degree progress bar against a configurable total unit count
- Focus view (one term at a time) and Grid view (all terms)
- Keyboard inputs on term cards — `Enter` flows through fields, `↑↓` steps grades, `Escape` clears

### Honors
- Dean's List badge per term with configurable tiers, unit minimums, and course grade floors
- Latin Honors modal with projected standing based on current CGPA
- No-fail policy flag — alerts when any course grade would disqualify Latin Honors eligibility

### University Settings
Ships with presets for four Philippine universities and a fully custom mode:

| Preset | Scale | Direction | Failing Grade |
|---|---|---|---|
| **DLSU** | 0.0 – 4.0 | Ascending | 0.0 |
| **UP** | 1.0 – 5.0 | Descending | 5.0 |
| **UST** | 1.0 – 5.0 | Descending | 5.0 |
| **ADMU** | 0.0 – 4.0 | Ascending | 0.0 |
| **Custom** | Configurable | Configurable | Configurable |

Custom mode exposes full control over grade bounds, direction, step size, honor tier labels and thresholds, unit constraints, and honor policies.

### Plan Page
A separate full-screen flowchart view of all terms. Courses can be dragged between terms — the move carries the full course object (name, units, grade). Changes sync back to the main tracker immediately.

### GE Checklist
A collapsible panel on the Plan page listing general education requirements. Ships with a DLSU preset list; custom items can be added and removed. Completion state is persisted.

### Unit Calculator
Answers the question: given your current CGPA and remaining units, how many units of a given grade can you still afford before dropping below your target Latin Honor? Calculates for every grade step defined in your university settings, including the failing grade where applicable.

### Theme System
13 built-in themes (dark and light variants) plus a custom 15-token palette editor. Themes apply before the first paint — no flash of unstyled content. Custom themes can be exported as a `.css` file and imported back.

### Export Page
Generate a styled PNG card of your academic summary or a specific term. Widget visibility is toggleable (summary, term header, course list, Dean's List badge). Grade values can be masked or hidden for privacy. Multiple aspect ratios supported.

---

## Getting Started

**Prerequisites:** [Bun](https://bun.sh)

```bash
git clone https://github.com/yourusername/nockr.git
cd nockr
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
bun run build       # Production build
bun run preview     # Preview production build
bun run check       # svelte-check + TypeScript
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
| Drag and Drop | svelte-dnd-action |
| Image Export | html-to-image *(in progress)* |
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
│   │   ├── plan/           # TermColumn, CourseCard, GEPanel (Plan page)
│   │   ├── settings/       # Settings sidebar, theme picker
│   │   ├── share/          # Share canvas, widgets
│   │   ├── summary/        # Academic summary card & unit calculator
│   │   ├── term/           # TermCard, CourseRow, TermNavigator
│   │   └── ui/             # shadcn-svelte primitives
│   ├── logic/
│   │   ├── gpa.ts          # TGPA, CGPA, units earned
│   │   ├── honors.ts       # Tier matching, Dean's List, Latin Honors
│   │   ├── share.ts        # Canvas capture, theme injection, grade masking
│   │   └── unitCalc.ts     # Unit calculator solver
│   ├── schemas/            # Zod schemas for all data types
│   ├── stores/             # localStorage-backed Svelte store
│   ├── themes/             # Theme metadata + CSS variable applicator
│   └── constants.ts        # University presets, GE list, aspect ratio dimensions
└── routes/
    ├── +layout.svelte      # Theme hydration, aurora background, GPU detection
    ├── +page.svelte        # Main tracker (summary + term navigator)
    ├── plan/
    │   └── +page.svelte    # Plan page (flowchart + GE checklist)
    ├── export/
    │   └── +page.svelte    # Export page (toggleable widgets, aspect ratios)
    └── layout.css          # Theme variables, glass/aurora utilities, .no-gpu fallbacks
```

---

## Data & Privacy

Nockr uses no database and has no backend. All data is stored locally in your browser's `localStorage` under the key `nockr_state`. Nothing is transmitted anywhere.

Clearing your browser's site data or using private/incognito mode will reset the app. If you want to back up your data, use the JSON export option to save a local copy you can restore later.

---

## Contributing

Contributions are welcome. Please follow the conventions below for a consistent history.

### Commit Convention

Format: `<type>(<scope>): <subject>`

The scope is optional but encouraged for larger codebases.

```
feat(plan): add drag-and-drop course reordering
fix(scroll): correct sub-pixel edge snap in TermNavigator
chore: update dependencies
```

#### Types

| Type | When to use |
|---|---|
| `feat` | New feature or user-facing addition |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior difference |
| `style` | Formatting, whitespace, visual-only changes |
| `chore` | Tooling, dependencies, config, non-src changes |
| `docs` | README or documentation only |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |

#### Rules
- Use the imperative mood in the subject: "add X", not "added X" or "adds X"
- Keep the subject line under 72 characters
- No period at the end of the subject line
- If a commit needs more context, add a body after a blank line

### Branching Convention

Format: `<type>/<short-description>`

```
feat/unit-calculator
fix/scroll-edge-snap
refactor/share-canvas-theme-injection
```

#### Branch Types

| Type | When to use |
|---|---|
| `feat` | New feature work |
| `fix` | Bug fix |
| `refactor` | Restructuring existing code |
| `chore` | Tooling, config, dependency updates |
| `docs` | Documentation only |

#### Rules
- Use kebab-case for the description
- Keep it short — 2 to 4 words is enough
- Branch off `main` for all work
- Delete branches after merging

---

## License

GPL 3.0