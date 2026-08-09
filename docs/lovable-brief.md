# Lovable Brief — MindVault UI Modernization

> **How to use this file:** paste everything below the line into Lovable as your first prompt. Iterate from there. When you're happy, send back the preview URL plus screenshots of each screen in **both light and dark**.
>
> This design will be hand-ported to React Native, so the constraints in §2 are not stylistic preferences — they're the difference between a design that ports and one that has to be redrawn.

---

Build a complete, navigable UI prototype for **MindVault**, an iPad-first second-brain app. Every screen listed in §5 should exist and be clickable, in both light and dark mode.

## 1. What MindVault is

MindVault captures ideas and connects them to goals, tasks, and projects — the connective layer between thinking and doing. It is **not** a generic notes app. It's inspired by Obsidian but simpler and usable on the go, while staying deep enough to be someone's actual second brain.

Design principles, in priority order:

1. **Calm and focused.** No marketing-style screens, no hero sections, no decorative gradients, no illustrations. This is a tool someone opens twenty times a day.
2. **Dense and scannable.** Lists, planning views, and linked-entity sections should show a lot without feeling cramped. Prefer information density over whitespace drama.
3. **iPad-first, phone-second.** Design the tablet layout as the primary case, then make the phone layout work cleanly.
4. **AI is optional and clearly labeled.** AI actions are always user-triggered, never automatic. They should look like offers, not like the app doing things on its own.

## 2. Hard technical constraints — please follow exactly

This design gets rebuilt in React Native. The following do not exist there, so **do not use them anywhere**:

- ❌ CSS Grid — **use flexbox only** (`flex`, `flex-col`, `gap-*`, `flex-1`)
- ❌ Hover-only states — anything reachable only by hovering is invisible on touch. Hover may *enhance*, never *reveal*.
- ❌ `backdrop-filter` / frosted glass / blur
- ❌ `position: sticky`, scroll-linked animation, parallax, scroll-snap
- ❌ Gradient text, `background-clip: text`, text shadows
- ❌ CSS pseudo-elements for visible content (`::before` / `::after`)
- ❌ Custom scrollbar styling, `:focus-within`, `transition` on anything but opacity/transform/color

Also:

- ✅ **Use only Tailwind's default spacing steps** (`p-4`, `gap-6`, `mt-2`…). **No arbitrary values** like `p-[18px]` or `gap-[22px]`. The port maps Tailwind's scale 1:1 at `rem = 16`, so `p-4` means 16px here and 16pt on device. Arbitrary values have to be hand-translated.
- ✅ Border radius: pick **one** value for cards, one for controls/inputs, one for pills. Name them. Don't scatter `rounded-lg`/`xl`/`2xl`/`3xl` at random — that's exactly the inconsistency we're fixing.
- ✅ Shadows: at most a **3-step depth ladder**, and keep them subtle. React Native shadows are much cruder than CSS.
- ✅ Icons: use a single icon set throughout, outline style, consistent stroke weight. (We render Ionicons outline icons, so anything in that family ports directly.)
- ✅ Every interactive element must have a **minimum 44×44px touch target**.

## 3. Visual direction — evolve, don't replace

Keep the existing identity. The accent is a **muted gold**, and the app supports true light and dark modes. Current values:

| Token | Light | Dark | Used for |
|---|---|---|---|
| `background` | `#ffffff` | `#121212` | page ground |
| `surface` | `#f2f2f7` | `#1e1e1e` | cards, inputs, rows |
| `surface-2` | `#ffffff` | `#2c2c2e` | raised surface on top of `surface` |
| `foreground` | `#111111` | `#f5f5f5` | primary text |
| `muted` | `#6c6c70` | `#aeaeb2` | secondary text, icons |
| `border` | `#c6c6c8` | `#38383a` | hairlines |
| `primary` | `#b8860b` | `#d4a017` | accent, primary buttons |
| `primary-foreground` | `#1a1a1a` | `#1a1a1a` | text **on** primary |
| `destructive` | `#ff3b30` | `#ff453a` | delete, errors |

You may refine these hexes for better contrast and warmth — but stay recognizably the same app. **Do not switch to a different accent hue.**

What we want you to add, because it genuinely doesn't exist yet:

- A **type scale** with clear hierarchy — screen title, section header, card title, body, caption, and the small uppercase "eyebrow" label used above sections. Give each a size, weight, line-height, and letter-spacing.
- A **depth system** (§6, question 3).
- Consistent **section rhythm** — how much space sits between a section header and its content, and between sections.

## 4. Data model — design for *this* data

| Entity | Fields |
|---|---|
| **Idea** | title · description (long text) · category (one) · tags (many) · created_at · last_viewed_at |
| **Goal** | title · priority (high/medium/low) · deadline (date) · category |
| **Project** | title · main_goal (a sentence describing the outcome) · category |
| **Task** | title · done (bool) · due_date · priority · notes — **tasks only ever exist inside a project**, there is no global task list |
| **Category** | name — an idea/goal/project/task has at most one |
| **Tag** | name — an idea has many |

**Cross-linking is the core of the product.** These links exist and must be creatable and removable **from both sides**:

- Idea ↔ Goal
- Idea ↔ Project
- Goal ↔ Project

Linked items appear as a labeled section on each detail screen with a row per linked item, an add affordance, and per-row remove.

## 5. Screens to design

Design all of these. Phone and tablet layout for each.

### Auth
1. **Login** — logo mark + wordmark + one-line tagline, email + password, primary "Log in", "Sign in with Apple" and "Sign in with Google" buttons, link to register.
2. **Register** — same form, no logo, link back to login. Plus a **post-submit "check your email" confirmation state**.

### Main app — bottom tab bar with 5 tabs: Home · Ideas · Goals · Projects · Map

3. **Home (dashboard)** — greeting/title + today's date · three metric tiles (Ideas / Goals / Projects counts, each tappable) · a "Morning Brief" AI card (opt-in, user-triggered) · a **"Revisit an idea"** section surfacing ideas not viewed recently · an **"Active goals"** section showing the next 2 by deadline, with a "View all" affordance.
   *Note: three tiles in a row currently wrap awkwardly on phone — please solve this deliberately.*

4. **Ideas list** — search field, list of idea cards (title + description excerpt + category + tags), floating create button.
5. **Idea detail** — editable title and description inline · category picker · tag chips with add/remove · **two AI actions**: "Suggest category" and "Expand this idea" (each with a one-line explanation of what it reads) · Linked Goals section · Linked Projects section · delete affordance.
6. **Goals list** — search, goal cards showing title + priority chip + deadline chip. Deadline chips need an **urgency treatment** (overdue / due soon / comfortable).
7. **Goal detail** — editable title · priority selector · deadline date picker · Linked Ideas · Linked Projects · delete.
8. **Projects list** — search, project cards (title + main_goal excerpt).
9. **Project detail** — the densest screen. Editable title + main_goal · a **"Plan with AI"** action · Linked Goals · **task list** (checkbox, title, due date, priority, edit, delete, add) · Referenced Ideas · delete.
10. **Mind map** — three count tiles + a node-and-edge graph showing ideas, goals, and projects as differently-colored nodes with connecting lines. Nodes are tappable. Needs to work in both themes.
11. **Settings** — signed-in-as card · personal information (avatar picker, display name, email, change password, save) · appearance mode picker (System / Light / Dark) · sign out.

### Modals / sheets
12. **Create & edit** sheets for Idea, Goal, Project, Task — a shared shell: small uppercase eyebrow label, large title input, optional body input, type-specific controls, error text slot, cancel + submit.
13. **Pickers** — category picker, tag picker (with create-new), and a generic "link an item" picker with search + multi-select checkmarks.
14. **AI result sheets** — expanded-idea result, and an AI-generated task preview with per-task accept/reject.

## 6. Please answer these six questions explicitly

Include a short written summary alongside the prototype:

1. **Priority colors for high / medium / low, in both light and dark.** These need to be semantic tokens that read correctly on light *and* dark surfaces. (Ours are currently near-black reds that are invisible in light mode.)
2. **Is a rounded typeface part of the identity?** If yes, name a **Google Fonts** face (Quicksand and Nunito are the closest to what we're going for) — we can't use SF Pro Rounded on Android. If a neutral sans is better here, say so.
3. **How does elevation read in dark mode?** In React Native, shadows can't change between themes the way colors can. So dark mode needs a different depth mechanism — a lighter surface step, a hairline border, a subtle glow, or deliberately flat. Tell us which, and show it.
4. **Mind-map node colors in both themes** — one per node type (idea / goal / project), plus the edge/line color. These must work on both a white and a near-black canvas.
5. **What the layout does at ≥1024px.** Show the iPad layout explicitly, don't just let it stretch. Should content be centered with a max width? Do lists go multi-column? What changes at landscape?
6. **Confirm the on-primary text color.** We believe near-black (`#1a1a1a`) on the gold accent is correct — please verify contrast and confirm or correct it.

## 7. Design every state, not just the happy path

For **every list and every detail screen**, design all five:

- **Populated** — the normal case
- **Loading** — first load
- **Empty** — no data yet. Empty states should help the user take the next meaningful action, not just say "nothing here."
- **Error** — something failed, with a retry affordance
- **Not found** — a detail screen for a record that doesn't exist, **with a way back** (ours are currently dead ends)

Also design: search-with-no-results (distinct from empty), a disabled/loading primary button, and inline field validation errors.

## 8. What to send back

- The Lovable preview URL
- Screenshots of every screen in **light and dark**, at phone width and tablet width
- The written answers to §6
- The final token values you settled on — colors, type scale, radii, spacing rhythm, shadow ladder
