---
name: shift-manager-frontend
description: Comprehensive guide for building a shift management system frontend with Next.js App Router and Supabase. Use when building UI for shift scheduling, calendar views, drag-and-drop assignment, real-time constraint checking, or any workforce management application. Includes patterns for database integration, state management, and complex UI interactions specific to shift management workflows.
---

# Shift Manager Frontend

## Overview

This skill provides battle-tested patterns and workflows for building a shift management system frontend using Next.js 14 (App Router) and Supabase. It covers everything from initial setup to complex features like drag-and-drop shift assignment, real-time constraint validation, and calendar-based UI interactions.

## Workflow Decision Tree

**Start here to determine your next steps:**

1. **Setting up a new project?** → See [Project Setup](#project-setup)
2. **Need database integration?** → See `references/supabase-patterns.md`
3. **Building calendar UI?** → See `references/calendar-ui.md`
4. **Implementing drag-and-drop?** → See `references/drag-and-drop.md`
5. **Need Next.js patterns?** → See `references/nextjs-app-router.md`
6. **Starting from scratch?** → Use templates in `assets/nextjs-template/`

## Project Setup

### Initial Setup

For new shift management projects, start with the boilerplate template:

```bash
# Copy the Next.js + Supabase template
cp -r assets/nextjs-template/ ./my-shift-manager
cd my-shift-manager
npm install
```

### Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Hooks + Zustand (for complex state)
- **UI Components**: shadcn/ui (optional)
- **Calendar**: react-big-calendar or FullCalendar
- **Drag & Drop**: @dnd-kit/core

### Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Core Features Implementation

### 1. Database Schema Setup

First, set up your Supabase database schema. See `references/supabase-patterns.md` for:
- Table creation with RLS (Row Level Security)
- Type generation for TypeScript
- Real-time subscriptions
- Optimistic updates

### 2. Calendar-Based Shift View

Implement the main shift calendar interface. See `references/calendar-ui.md` for:
- Month/week/day view switching
- Shift cell rendering
- Time slot management
- Responsive design patterns

### 3. Drag-and-Drop Assignment

Enable drag-and-drop shift assignment. See `references/drag-and-drop.md` for:
- Setting up @dnd-kit
- Draggable staff components
- Droppable shift slots
- Collision detection
- Visual feedback

### 4. Real-Time Constraint Checking

Implement live validation as users assign shifts. Patterns include:
- Client-side validation hooks
- Real-time database triggers
- Visual warning indicators
- Constraint violation messages

## Key Principles

### 1. Type Safety First

Always generate TypeScript types from your Supabase schema:

```bash
npx supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

### 2. Optimistic Updates

For better UX, update UI immediately while syncing to database:
- Show changes instantly
- Handle conflicts gracefully
- Revert on error

### 3. Progressive Enhancement

Build features in layers:
- Start with basic functionality
- Add interactivity
- Enhance with real-time updates
- Polish with animations

### 4. Mobile-First Design

Shift managers often work on tablets/phones:
- Touch-friendly hit targets (min 44x44px)
- Responsive calendar layouts
- Gesture support for drag-and-drop
- Offline-capable (future enhancement)

## Common Patterns

### Pattern 1: Shift Assignment Flow

```typescript
// 1. User drags staff to shift slot
// 2. Validate constraints (client-side)
// 3. Show immediate feedback
// 4. Save to database (optimistic)
// 5. Revalidate on server
// 6. Handle conflicts
```

### Pattern 2: Constraint Checking

```typescript
// Real-time validation as shifts are assigned
const validateShift = (staffId, shiftId, date) => {
  // Check required qualifications
  // Check max hours per week
  // Check rest periods
  // Check availability
  // Return validation result
}
```

### Pattern 3: State Management

```typescript
// Use Zustand for complex shift state
interface ShiftStore {
  shifts: Shift[]
  constraints: Constraint[]
  violations: Violation[]
  addShift: (shift: Shift) => void
  validateShifts: () => void
}
```

## Resources

This skill includes example resource directories that demonstrate how to organize different types of bundled resources:

### scripts/
Executable code (Python/Bash/etc.) that can be run directly to perform specific operations.

**Examples from other skills:**
- PDF skill: `fill_fillable_fields.py`, `extract_form_field_info.py` - utilities for PDF manipulation
- DOCX skill: `document.py`, `utilities.py` - Python modules for document processing

**Appropriate for:** Python scripts, shell scripts, or any executable code that performs automation, data processing, or specific operations.

**Note:** Scripts may be executed without loading into context, but can still be read by Claude for patching or environment adjustments.

### references/
Documentation and reference material intended to be loaded into context to inform Claude's process and thinking.

**Examples from other skills:**
- Product management: `communication.md`, `context_building.md` - detailed workflow guides
- BigQuery: API reference documentation and query examples
- Finance: Schema documentation, company policies

**Appropriate for:** In-depth documentation, API references, database schemas, comprehensive guides, or any detailed information that Claude should reference while working.

### assets/
Files not intended to be loaded into context, but rather used within the output Claude produces.

**Examples from other skills:**
- Brand styling: PowerPoint template files (.pptx), logo files
- Frontend builder: HTML/React boilerplate project directories
- Typography: Font files (.ttf, .woff2)

**Appropriate for:** Templates, boilerplate code, document templates, images, icons, fonts, or any files meant to be copied or used in the final output.

---

**Any unneeded directories can be deleted.** Not every skill requires all three types of resources.
