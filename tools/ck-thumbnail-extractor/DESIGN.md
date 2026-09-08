---
name: Hogwarts Legacy CK Thumbnail Extractor
description: A local processing queue for Creator Kit cached thumbnails.
colors:
  active-amber: "#f8d451"
  ivory-ink: "#f4f4f0"
  ash-text: "#858b8d"
  dim-state: "#484c51"
  emissive-black: "#080808"
  depth-plane: "#101112"
  error-coral: "#ff8a70"
  focus-ivory: "#fff3b0"
typography:
  display:
    fontFamily: "Cascadia Mono, SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: "clamp(1.4rem, 2.7vw, 2.4rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.08em"
  body:
    fontFamily: "Cascadia Mono, SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Cascadia Mono, SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.08em"
rounded:
  none: "0"
spacing:
  mobile-edge: "1rem"
  desktop-edge: "3.2vw"
components:
  button-active:
    backgroundColor: "transparent"
    textColor: "{colors.active-amber}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1.1rem"
  button-active-hover:
    backgroundColor: "{colors.active-amber}"
    textColor: "{colors.emissive-black}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1.1rem"
---

# Design System: Hogwarts Legacy CK Thumbnail Extractor

## Overview

**Creative North Star: "The CK Cache Terminal"**

The interface reads like a purpose-built inspection terminal. A package queue owns
the upper plane, exact extraction facts sit beside the active preview, and amber is
reserved for the current action. The system is dense enough for batch work without
hiding outcomes behind panels or menus.

**Key Characteristics:**

- Near-black field with ivory and ash text
- Monospaced filenames, offsets, dimensions, and counters
- One amber signal for selection, focus, and primary action
- Dotted rules and tonal planes instead of cards or decorative imagery

## Colors

Amber marks the active choice; neutral contrast carries everything else.

### Primary

- **Active Amber:** Primary buttons, selected radio controls, queue pointers, focus
  feedback, and text selection.

### Neutral

- **Ivory Ink:** Headings, short labels, and high-priority facts.
- **Ash Text:** Package names, explanations, and inactive status text.
- **Dim State:** Disabled actions, quiet rows, rules, and scrollbars.
- **Emissive Black:** The page field and inverse text on amber controls.
- **Depth Plane:** A reserved darker tonal layer for future terminal surfaces.

### Named Rules

**The One Signal Rule.** Amber identifies action or focus; it never becomes ambient
decoration.

## Typography

**Display Font:** Cascadia Mono with platform monospace fallbacks

**Body Font:** The same monospace stack

**Label/Mono Font:** The same monospace stack

**Character:** The single family keeps long CK identifiers, hashes, offsets, and
controls aligned. Hierarchy comes from scale, case, weight, and spacing rather than
mixing unrelated type voices.

### Hierarchy

- **Display:** Fluid headings for the active package and extraction result.
- **Headline:** Compact product and section names with generous tracking.
- **Body:** Sentence-case explanations with a maximum readable measure of 70ch.
- **Label:** Short uppercase facts and statuses with tabular numerals where needed.

### Named Rules

**The Identifier Rule.** Preserve filename case in queue rows; reserve uppercase for
short operational labels and statuses.

## Layout

Desktop uses five horizontal planes: masthead, queue, controls, active result, and
summary. The queue receives the largest flexible area. Page edges use the desktop
gutter; related controls stay on one baseline.

At 760px and below, every plane becomes a single column. Controls keep their source
order, the preview precedes its facts, and the queue remains scrollable rather than
pushing the current result indefinitely down the page.

## Elevation & Depth

The system has no drop shadows. Depth is expressed with brightness, spacing, scale,
and thin rules. Drag state adds a sharp inset outline rather than a glow.

## Shapes

Corners remain square. Buttons use thin rectangular rules and bracketed text. Queue
rows are open horizontal strips separated by dotted lines; they are not cards.

## Components

### Buttons

- **Shape:** Square, bracketed, and outlined for the primary action.
- **Primary:** Transparent field with amber text and a two-pixel amber rule.
- **Hover / Focus:** Hover inverts to amber with black text. Keyboard focus uses a
  separate two-pixel ivory outline with a four-pixel offset.
- **Text actions:** Underline appears only on hover; disabled actions use the dim
  neutral and keep a text label.

### Inputs / Fields

- **Style:** Native file inputs stay visually hidden behind explicit file and folder
  buttons. Radio inputs remain native and visible.
- **Focus:** Every interactive control receives the shared ivory focus outline.
- **Error / Disabled:** Errors use coral text; disabled actions stay visible in the
  dim neutral.

### Package Queue

Each row pairs a CK-relative filename with a textual status. The active row grows,
adds one amber pointer, and remains selectable by keyboard. Failure and cache-miss
states never rely on color alone.

## Do's and Don'ts

### Do:

- **Do** keep local-processing status visible before file selection.
- **Do** expose exact filenames, dimensions, offsets, and result counts.
- **Do** keep active, loading, failed, empty, disabled, hover, and focus states legible.

### Don't:

- **Don't** add remote fonts, decorative game art, uploads, or analytics.
- **Don't** introduce rounded cards, ornamental fantasy motifs, gradients, or glow.
- **Don't** use amber for passive decoration or status that does not need attention.
