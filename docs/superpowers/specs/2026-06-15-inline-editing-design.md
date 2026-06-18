# Inline Editing for Goals, Projects, and Ideas Detail Screens

**Date:** 2026-06-15
**Status:** Approved

## Problem

GoalDetail and ProjectDetail use a read-first view gated behind a pencil icon that opens an edit modal. IdeaDetail uses always-editable inline inputs but requires a manual Save button. None of these are consistent with each other, and the modal pattern adds unnecessary friction.

## Goal

All three detail screens (GoalDetail, ProjectDetail, IdeaDetail) should use inline editable fields with **blur-to-save** (or change-to-save for pickers), with **optimistic updates and rollback on error**.

---

## Save Behavior (all screens)

On `onBlur` of a `TextInput` (or `onChange` for discrete pickers like `DatePicker` and `CategoryPicker`):

1. Capture the `previousValue` before committing
2. Optimistically apply the new value to local state (already the case since fields are controlled)
3. Call `update(id, { field: value })`
4. If the call rejects → revert local state to `previousValue` and show an error toast

The error toast should use whatever feedback mechanism already exists in the app (to be confirmed during implementation).

---

## GoalDetail (`app/(app)/goals/[id].tsx`)

**Fields going inline:**
- `title` — `TextInput`, blur-to-save
- `deadline` — `DatePicker`, change-to-save (discrete event, no blur)

**Removals:**
- `editVisible` state
- `editSnapshot` state
- `EditGoalModal` import and usage
- Pencil icon from the header

**Unchanged:** back nav, trash icon, milestones section, linked ideas section, linked projects section, all relation management.

---

## ProjectDetail (`app/(app)/projects/[id].tsx`)

**Fields going inline:**
- `title` — `TextInput`, blur-to-save
- `main_goal` — multiline `TextInput`, blur-to-save

**Removals:**
- `editVisible` state
- `editSnapshot` state
- `EditProjectModal` import and usage
- Pencil icon from the header

**Unchanged:** back nav, trash icon, AI button, goals section, tasks section, ideas section, all relation management and task editing.

---

## IdeaDetail (`app/(app)/ideas/[id].tsx`)

**Fields going inline (already inline, just changing save trigger):**
- `title` — `TextInput`, change Save button to blur-to-save
- `description` — `TextInput`, change Save button to blur-to-save
- `categoryId` — `CategoryPicker`, already fires `onChange` discretely — wire to `update` directly

**Removals:**
- Save button from the header

**Unchanged:** back nav, trash icon, category picker, all other UI.

---

## Error Handling

- On save failure: revert the field to `previousValue`, show error toast
- No retry UI — the user can simply re-edit the field
- No loading indicator per field (keep UI clean; the optimistic path covers most cases)

---

## Out of Scope

- Conflict resolution for simultaneous edits (future multi-user concern)
- Undo/redo
- Autosave debounce (blur is sufficient; no need for change-debounce on text fields)
