# Design Brief: Kursverwaltung

## 1. App Analysis

### What This App Does
Kursverwaltung is a course management system for an educational institution. It manages rooms (Räume), instructors (Dozenten), courses (Kurse), participants (Teilnehmer), and registrations (Anmeldungen). The system tracks which participants are enrolled in which courses, which instructors teach them, where they take place, and whether fees have been paid.

### Who Uses This
An administrative coordinator at a training center or Volkshochschule. They manage course schedules, track enrollments, follow up on payments, and ensure rooms and instructors are properly assigned. They need a quick overview of the current state of operations every morning.

### The ONE Thing Users Care About Most
**Active registrations and payment status.** The coordinator's primary concern is: "How many people are registered, and have they paid?" This drives revenue and operational planning. The hero metric is the total number of registrations with a payment completion rate.

### Primary Actions (IMPORTANT!)
1. **Neue Anmeldung** → Primary Action Button (register a participant for a course)
2. Neuen Kurs anlegen (create a new course)
3. Neuen Teilnehmer anlegen (add a new participant)

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design uses a cool slate-blue base with a refined teal accent, evoking a professional academic environment. The slightly warm off-white background avoids clinical sterility while the teal accent (#0D9488 range) gives interactive elements a distinctive, fresh feel that separates this from generic blue dashboards. The overall impression is "organized, calm, trustworthy" - like a well-run institution.

### Layout Strategy
- **Asymmetric hero layout**: The hero section spans full width with a large registration count and payment progress bar, creating immediate visual impact
- **Size variation**: The hero KPI is displayed at 48px bold, dwarfing the 24px secondary KPIs below it
- **Three unequal secondary KPIs** sit below the hero in a row (desktop) or stacked (mobile)
- **Main content splits into 2:1 ratio** on desktop: left side has the course list with enrollment bars, right side has recent activity feed
- **Spacing variation**: Tighter within card groups, generous 32px between sections

### Unique Element
The **enrollment capacity bar** on each course card - a thin horizontal progress bar showing enrolled/max_teilnehmer ratio. When a course is nearly full (>80%), the bar shifts to amber; when full, it turns red. This gives an instant visual read on course capacity across all courses without needing to open details.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap`
- **Why this font:** Plus Jakarta Sans has a professional, geometric clarity with subtle warmth in its letter shapes. It reads well at both large hero sizes and small label text, and its weight range (300-800) enables strong typographic hierarchy.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(210 20% 98%)` | `--background` |
| Main text | `hsl(215 25% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(215 25% 15%)` | `--card-foreground` |
| Borders | `hsl(214 20% 90%)` | `--border` |
| Primary action | `hsl(172 66% 30%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(172 50% 94%)` | `--accent` |
| Muted background | `hsl(210 15% 95%)` | `--muted` |
| Muted text | `hsl(215 15% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(152 60% 40%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |
| Warning/amber | `hsl(38 92% 50%)` | (component use) |

### Why These Colors
The cool blue-gray base creates a calm, professional atmosphere. The teal primary stands out as an intentional, sophisticated choice - not generic blue. The warm off-white background (slight blue undertone) prevents the page from feeling stark. Success green and destructive red are reserved for payment status and delete actions, keeping the palette focused.

### Background Treatment
A very subtle cool off-white (`hsl(210 20% 98%)`) that differentiates from pure white cards. This creates gentle depth without any gradient or texture. The slight blue undertone connects to the overall cool palette.

---

## 4. Mobile Layout (Phone)

### Layout Approach
The hero dominates the first viewport fold with a large registration count and payment ring. Below, secondary stats are displayed as a compact horizontal scroll row (not cards). The course list follows as full-width cards with enrollment bars. The primary action floats as a fixed bottom button.

### What Users See (Top to Bottom)

**Header:**
Sticky top bar with "Kursverwaltung" title (18px, weight 700) on the left. No actions in header on mobile - the FAB handles the primary action.

**Hero Section (The FIRST thing users see):**
- A full-width card taking ~40% of viewport height
- Center-aligned large number: total Anmeldungen count, displayed at 48px bold weight 800
- Below the number: "Anmeldungen gesamt" label in 14px muted text
- Below the label: a horizontal progress bar (8px tall, rounded-full) showing payment rate (bezahlt/total). The bar is teal (primary) on the filled portion, muted on unfilled.
- Below the bar: "XX% bezahlt" text in 14px, teal color
- Why this is the hero: the coordinator's #1 question every morning is "how many registrations, and are they paid?"

**Section 2: Quick Stats Row**
- Horizontal scrollable row of 3 compact stat items (not cards, just inline flex items with subtle separator lines):
  - Aktive Kurse (count of courses where enddatum >= today)
  - Teilnehmer (total unique participants)
  - Dozenten (total instructors)
- Each stat: 24px bold number, 12px muted label below
- This row is compact - no cards, just numbers with labels

**Section 3: Kurse (Course List)**
- Section header: "Kurse" (16px semibold) with a "+" button on the right to add a course
- Full-width cards for each course, showing:
  - Kurstitel (16px semibold)
  - Dozent name + Raum name on one line (13px muted)
  - Date range: startdatum - enddatum (13px muted)
  - Enrollment bar: thin (6px) bar showing registrations/max_teilnehmer
  - "X/Y Plätze" label right-aligned (12px)
  - Preis as a badge (e.g., "€120")
- Cards are tappable to open detail/edit view

**Section 4: Teilnehmer**
- Section header: "Teilnehmer" with "+" button
- Simple list items (not full cards): Name, Email in one line, compact 48px height rows
- Tappable for edit

**Section 5: Räume & Dozenten**
- Collapsed accordion sections for managing rooms and instructors
- Each expands to show simple list with "+" add button

**Bottom Navigation / Action:**
- Fixed bottom button: "Neue Anmeldung" (full-width, teal primary color, 48px height)
- 16px padding from edges, 16px from bottom (safe area aware)

### Mobile-Specific Adaptations
- Hero section is full-width with generous vertical padding (24px)
- Course cards stack vertically with 12px gaps
- Quick stats use horizontal scroll instead of wrapping
- Räume and Dozenten are collapsed by default (accordion) to save space
- All list items have at minimum 48px touch targets

### Touch Targets
- All buttons minimum 44px height
- List items minimum 48px height
- The bottom fixed button is 48px height with generous horizontal padding

### Interactive Elements
- Course cards: tap to open detail dialog with full info + edit/delete actions
- Teilnehmer items: tap to open detail dialog
- Enrollment bar on course cards: visual-only, no interaction needed

---

## 5. Desktop Layout

### Overall Structure
A max-width container (1200px) centered on the page with 32px horizontal padding.

**Top row (full width):**
- Left: "Kursverwaltung" title (28px, weight 800)
- Right: Primary action button "Neue Anmeldung" (teal, with Plus icon)

**Hero row (full width):**
- Single full-width card with horizontal layout:
  - Left 40%: Large registration count (56px bold) with "Anmeldungen gesamt" label and payment progress bar below
  - Right 60%: Three stat boxes side by side (Aktive Kurse, Teilnehmer, Dozenten) - each with large number (32px bold) and label (14px muted)

**Main content area (2:1 split):**
- **Left column (65%):** Kurse section
  - Header with "Kurse" title + "Neuer Kurs" button
  - Table layout with columns: Kurstitel, Dozent, Raum, Zeitraum, Auslastung (enrollment bar), Preis
  - Rows are clickable for detail/edit
  - Hover: row background shifts to muted

- **Right column (35%):** Sidebar with stacked sections
  - **Letzte Anmeldungen**: List of 5 most recent registrations showing participant name, course title, date, and bezahlt badge
  - **Teilnehmer**: Compact list with search/filter, showing name + email. "+" button to add
  - **Räume**: Small card list showing room name, building, capacity
  - **Dozenten**: Small card list showing name, Fachgebiet, email

### Section Layout
- Top area: Title bar + hero stats card (full width)
- Main content: 65/35 split below hero
- Left: Course table (primary working area)
- Right: Activity feed + reference data management

### What Appears on Hover
- Course table rows: subtle muted background + slight shadow lift
- Stat cards in hero: no hover change (they're informational)
- List items in sidebar: muted background shift
- Edit/Delete icons appear on hover for each list item (hidden by default on desktop, always visible on mobile)

### Clickable/Interactive Areas
- Course rows → open detail dialog with all fields + edit/delete
- Recent registration items → open registration detail with payment toggle
- Teilnehmer list items → open detail dialog
- Räume/Dozenten items → open detail dialog

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Anmeldungen gesamt
- **Data source:** Anmeldungen app (count all records)
- **Calculation:** `anmeldungen.length` (total count)
- **Display:** Large number (48px mobile / 56px desktop, weight 800), centered on mobile, left-aligned on desktop
- **Context shown:** Payment progress bar below - ratio of `bezahlt === true` to total. Shows "XX% bezahlt" text.
- **Why this is the hero:** Registration volume and payment completion are the two metrics that drive everything else - revenue, capacity planning, and follow-up tasks.

### Secondary KPIs

**Aktive Kurse**
- Source: Kurse app
- Calculation: Count of courses where `enddatum >= today` (or enddatum is null)
- Format: number
- Display: 32px bold number on desktop (in hero card), 24px on mobile (horizontal scroll row)

**Teilnehmer**
- Source: Teilnehmer app
- Calculation: Total count of all Teilnehmer records
- Format: number
- Display: Same as Aktive Kurse

**Dozenten**
- Source: Dozenten app
- Calculation: Total count of all Dozenten records
- Format: number
- Display: Same as Aktive Kurse

### Chart: Enrollment Capacity Bar (per course)
- **Type:** Horizontal progress bar (not a recharts chart - use native HTML/Tailwind)
- **Title:** Auslastung (inline on each course card/row)
- **What question it answers:** "Is this course filling up? Do I need to open another section?"
- **Data source:** Anmeldungen (count per kurs) vs Kurse.max_teilnehmer
- **Calculation:** For each course, count registrations where `kurs` applookup matches, divide by `max_teilnehmer`
- **Colors:**
  - 0-79%: teal (primary)
  - 80-99%: amber (`hsl(38 92% 50%)`)
  - 100%: red (destructive)
- **Mobile simplification:** Same bar, slightly thinner (4px vs 6px)

### Lists/Tables

**Kurse (Courses)**
- Purpose: The main working list - users manage courses daily
- Source: Kurse app, enriched with Dozenten names (via applookup), Räume names, and registration counts (from Anmeldungen)
- Fields shown in list/table:
  - Kurstitel
  - Dozent (resolved name from Dozenten app)
  - Raum (resolved name from Räume app)
  - Startdatum - Enddatum (formatted as dd.MM.yyyy)
  - Auslastung (enrollment bar: registrations/max_teilnehmer)
  - Preis (formatted as EUR currency)
- Mobile style: Cards with stacked info
- Desktop style: Table rows
- Sort: By startdatum (newest first)
- Limit: Show all (no pagination needed for typical course counts)

**Letzte Anmeldungen (Recent Registrations) - Desktop sidebar only**
- Purpose: Quick glance at recent activity
- Source: Anmeldungen, enriched with Teilnehmer name and Kurs title
- Fields shown: Teilnehmer name, Kurs title, Anmeldedatum, Bezahlt badge (green "Bezahlt" or amber "Offen")
- Desktop style: Compact list items
- Sort: By anmeldedatum (newest first)
- Limit: 5 items

### Primary Action Button (REQUIRED!)

- **Label:** "Neue Anmeldung"
- **Action:** add_record
- **Target app:** Anmeldungen
- **What data:**
  - Teilnehmer (select from Teilnehmer app)
  - Kurs (select from Kurse app)
  - Anmeldedatum (date, default: today)
  - Bezahlt (checkbox, default: false)
- **Mobile position:** bottom_fixed (full-width teal button)
- **Desktop position:** header (top-right, teal button with Plus icon)
- **Why this action:** Registering participants for courses is the most frequent daily task. It should be one tap/click away.

### CRUD Operations Per App (REQUIRED!)

**Räume CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in Räume section header
  - Form fields: Raumname (text input), Gebäude (text input), Kapazität (number input)
  - Form style: Dialog/Modal
  - Required fields: Raumname
  - Default values: None

- **Read (Anzeigen):**
  - List view: Compact cards showing Raumname, Gebäude, Kapazität
  - Detail view: Click card → Dialog showing all fields
  - Fields shown in list: Raumname, Gebäude, Kapazität
  - Fields shown in detail: All fields
  - Sort: By Raumname alphabetically
  - Filter/Search: None (typically small list)

- **Update (Bearbeiten):**
  - Trigger: Pencil icon on hover (desktop) / always visible (mobile)
  - Edit style: Same dialog as Create, pre-filled with current values
  - Editable fields: All fields

- **Delete (Löschen):**
  - Trigger: Trash icon on hover (desktop) / always visible (mobile)
  - Confirmation: Always required
  - Confirmation text: "Möchtest du den Raum '{raumname}' wirklich löschen?"

**Dozenten CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in Dozenten section header
  - Form fields: Vorname (text), Nachname (text), E-Mail (email), Telefon (tel), Fachgebiet (text)
  - Form style: Dialog/Modal
  - Required fields: Vorname, Nachname
  - Default values: None

- **Read (Anzeigen):**
  - List view: Cards showing "Vorname Nachname", Fachgebiet, Email
  - Detail view: Dialog with all fields
  - Fields shown in list: Name (Vorname + Nachname), Fachgebiet
  - Fields shown in detail: All fields
  - Sort: By Nachname alphabetically
  - Filter/Search: None

- **Update (Bearbeiten):**
  - Trigger: Pencil icon
  - Edit style: Same dialog as Create, pre-filled
  - Editable fields: All fields

- **Delete (Löschen):**
  - Trigger: Trash icon
  - Confirmation: Always required
  - Confirmation text: "Möchtest du den Dozenten '{vorname} {nachname}' wirklich löschen?"

**Kurse CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "Neuer Kurs" button in Kurse section header
  - Form fields: Kurstitel (text), Beschreibung (textarea), Startdatum (date), Enddatum (date), Max. Teilnehmerzahl (number), Preis (number), Dozent (select from Dozenten app), Raum (select from Räume app)
  - Form style: Dialog/Modal
  - Required fields: Kurstitel, Startdatum
  - Default values: Startdatum = today

- **Read (Anzeigen):**
  - List view: Table rows (desktop) / Cards (mobile) - see Kurse list spec above
  - Detail view: Dialog showing all fields + enrollment count + participant list
  - Fields shown in list: See Kurse table spec
  - Fields shown in detail: All fields + enrolled participants
  - Sort: By Startdatum (newest first)
  - Filter/Search: None

- **Update (Bearbeiten):**
  - Trigger: Click row/card → detail dialog → Edit button (pencil icon in dialog header)
  - Edit style: Same dialog as Create, pre-filled
  - Editable fields: All fields

- **Delete (Löschen):**
  - Trigger: Trash icon in detail dialog
  - Confirmation: Always required
  - Confirmation text: "Möchtest du den Kurs '{titel}' wirklich löschen?"

**Teilnehmer CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in Teilnehmer section header
  - Form fields: Vorname (text), Nachname (text), E-Mail (email), Telefon (tel), Geburtsdatum (date)
  - Form style: Dialog/Modal
  - Required fields: Vorname, Nachname
  - Default values: None

- **Read (Anzeigen):**
  - List view: Compact rows showing "Vorname Nachname", Email
  - Detail view: Dialog with all fields + list of courses they're registered for
  - Fields shown in list: Name, Email
  - Fields shown in detail: All fields + registered courses
  - Sort: By Nachname alphabetically
  - Filter/Search: Text search by name (desktop sidebar)

- **Update (Bearbeiten):**
  - Trigger: Pencil icon
  - Edit style: Same dialog as Create, pre-filled
  - Editable fields: All fields

- **Delete (Löschen):**
  - Trigger: Trash icon
  - Confirmation: Always required
  - Confirmation text: "Möchtest du den Teilnehmer '{vorname} {nachname}' wirklich löschen?"

**Anmeldungen CRUD Operations**

- **Create (Erstellen):**
  - Trigger: Primary action button "Neue Anmeldung"
  - Form fields: Teilnehmer (select from Teilnehmer), Kurs (select from Kurse), Anmeldedatum (date), Bezahlt (checkbox)
  - Form style: Dialog/Modal
  - Required fields: Teilnehmer, Kurs
  - Default values: Anmeldedatum = today, Bezahlt = false

- **Read (Anzeigen):**
  - List view: Desktop sidebar shows recent 5. Full list accessible via "Alle anzeigen" link opening in main area
  - Detail view: Dialog showing Teilnehmer name, Kurs title, Anmeldedatum, Bezahlt status (toggleable)
  - Fields shown in list: Teilnehmer name, Kurs title, Datum, Bezahlt badge
  - Fields shown in detail: All fields resolved
  - Sort: By Anmeldedatum (newest first)

- **Update (Bearbeiten):**
  - Trigger: Click registration item → detail dialog → Edit button
  - Edit style: Same dialog as Create, pre-filled
  - Editable fields: All fields (Bezahlt toggleable directly via badge click in list)

- **Delete (Löschen):**
  - Trigger: Trash icon in detail dialog
  - Confirmation: Always required
  - Confirmation text: "Möchtest du diese Anmeldung wirklich löschen?"

---

## 7. Visual Details

### Border Radius
Rounded (8px / `--radius: 0.5rem`) - professional without being childish. Buttons use slightly more rounding (10px) for a softer feel.

### Shadows
Subtle - Cards use `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)). Hover state elevates to `shadow-md`. Dialogs use `shadow-xl`. No heavy drop shadows anywhere.

### Spacing
Normal to spacious:
- Between sections: 32px
- Between cards in a list: 12px
- Card internal padding: 20px (desktop), 16px (mobile)
- Header to first content: 24px
- Minimum page margin: 16px (mobile), 32px (desktop)

### Animations
- **Page load:** Subtle fade-in (200ms) for the whole page
- **Hover effects:** Cards lift slightly with shadow transition (150ms ease). Table rows get muted background (100ms)
- **Tap feedback:** Active state scales to 0.98 (50ms)
- **Dialog:** Default shadcn animation (fade + scale)

---

## 8. CSS Variables (Copy Exactly!)

```css
:root {
  --radius: 0.5rem;
  --background: hsl(210 20% 98%);
  --foreground: hsl(215 25% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(215 25% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(215 25% 15%);
  --primary: hsl(172 66% 30%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(210 15% 95%);
  --secondary-foreground: hsl(215 25% 15%);
  --muted: hsl(210 15% 95%);
  --muted-foreground: hsl(215 15% 50%);
  --accent: hsl(172 50% 94%);
  --accent-foreground: hsl(172 66% 20%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(214 20% 90%);
  --input: hsl(214 20% 90%);
  --ring: hsl(172 66% 30%);
  --chart-1: hsl(172 66% 30%);
  --chart-2: hsl(152 60% 40%);
  --chart-3: hsl(38 92% 50%);
  --chart-4: hsl(215 25% 60%);
  --chart-5: hsl(0 72% 51%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Plus Jakarta Sans, weights 300-800)
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero element is prominent as described
- [ ] Colors create the mood described in Section 2
- [ ] CRUD patterns are consistent across all apps
- [ ] Delete confirmations are in place
- [ ] Enrollment capacity bars show correct color coding
- [ ] Payment progress bar works on hero
- [ ] Sonner toast for all CRUD feedback
