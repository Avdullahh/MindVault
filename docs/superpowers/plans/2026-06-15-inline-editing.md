# Inline Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace modal-based editing in GoalDetail and ProjectDetail, and remove the Save button in IdeaDetail, so all three screens use blur-to-save inline inputs with optimistic rollback on error.

**Architecture:** Each detail screen already has local state for editable fields (or will get it). On blur (or discrete picker change), the handler captures a `savedX` ref value as the rollback target, calls `update()`, checks its `string | null` return — a non-null string means failure: revert local state and show inline error text. Refs (not the hook's re-fetched object) track the last successfully saved value to avoid async timing issues.

**Tech Stack:** React Native, Expo Router, `useGoals` / `useProjects` / `useIdeas` hooks (all `update` functions return `Promise<string | null>`, null = success)

---

## File Map

| File | Change |
|------|--------|
| `app/(app)/ideas/[id].tsx` | Remove `saving` state + Save button; add refs + blur handlers + error state |
| `app/(app)/goals/[id].tsx` | Remove `editVisible`, `editSnapshot`, `EditGoalModal`; add inline `title`/`deadline` state + DatePicker + blur handlers |
| `app/(app)/projects/[id].tsx` | Remove `editVisible`, `editSnapshot`, `EditProjectModal`; add inline `title`/`mainGoal` state + blur handlers |

---

## Task 1: IdeaDetail — replace Save button with blur-to-save

**Files:**
- Modify: `app/(app)/ideas/[id].tsx`

The screen already has controlled `title`, `description`, and `categoryId` state. We only need to add refs to track last-saved values, add blur handlers, remove `saving` + Save button, and wire `CategoryPicker.onChange`.

- [ ] **Step 1: Add refs and error state**

In `app/(app)/ideas/[id].tsx`, directly below the existing state declarations, add:

```tsx
const savedTitle = useRef('');
const savedDescription = useRef('');
const savedCategoryId = useRef<string | null>(null);
const [error, setError] = useState<string | null>(null);
```

Also add `useRef` to the React import if not already there.

- [ ] **Step 2: Initialize refs alongside existing state initialization**

Find the `useEffect` that currently calls `setTitle`, `setDescription`, `setCategoryId` (it runs when the idea is found). Add ref initialization inside it:

```tsx
useEffect(() => {
  if (idea) {
    setTitle(idea.title);
    setDescription(idea.description ?? '');
    setCategoryId(idea.category_id ?? null);
    // Add these three lines:
    savedTitle.current = idea.title;
    savedDescription.current = idea.description ?? '';
    savedCategoryId.current = idea.category_id ?? null;
  }
}, [idea?.id]);
```

- [ ] **Step 3: Replace `handleSave` with three blur/change handlers**

Delete the existing `handleSave` function and the `saving` state declaration. Add these three functions in their place:

```tsx
const handleTitleBlur = async () => {
  const trimmed = title.trim();
  if (!trimmed || trimmed === savedTitle.current) return;
  const previous = savedTitle.current;
  const err = await update(id, {
    title: trimmed,
    description: description.trim() || null,
    category_id: categoryId,
  });
  if (err) {
    setTitle(previous);
    setError(err);
  } else {
    savedTitle.current = trimmed;
    setError(null);
  }
};

const handleDescriptionBlur = async () => {
  const trimmed = description.trim() || null;
  const savedTrimmed = savedDescription.current.trim() || null;
  if (trimmed === savedTrimmed) return;
  const previous = savedDescription.current;
  const err = await update(id, {
    title: title.trim(),
    description: trimmed,
    category_id: categoryId,
  });
  if (err) {
    setDescription(previous);
    setError(err);
  } else {
    savedDescription.current = description;
    setError(null);
  }
};

const handleCategoryChange = async (newCategoryId: string | null) => {
  if (newCategoryId === savedCategoryId.current) return;
  const previous = savedCategoryId.current;
  setCategoryId(newCategoryId);
  const err = await update(id, {
    title: title.trim(),
    description: description.trim() || null,
    category_id: newCategoryId,
  });
  if (err) {
    setCategoryId(previous);
    setError(err);
  } else {
    savedCategoryId.current = newCategoryId;
    setError(null);
  }
};
```

- [ ] **Step 4: Update the header — remove the Save Pressable**

Find this block in the header and delete it entirely (keep the trash Pressable):

```tsx
<Pressable className="min-h-11 px-3 items-center justify-center" onPress={handleSave} disabled={saving || !title.trim()} accessibilityRole="button" accessibilityState={{ disabled: saving || !title.trim(), busy: saving }}>
  <Text className={saving ? 'text-muted' : 'text-primary font-semibold'}>Save</Text>
</Pressable>
```

The header's right side should now contain only the trash icon Pressable.

- [ ] **Step 5: Wire blur handlers and error text into JSX**

Find the `TextInput` for `title`. Add `onBlur={handleTitleBlur}` to it.

Find the `TextInput` for `description`. Add `onBlur={handleDescriptionBlur}` to it.

Find the `CategoryPicker` component. Change its `onChange` prop (currently it calls `setCategoryId`) to `onChange={handleCategoryChange}`.

Add error text immediately below the title TextInput:

```tsx
{error && (
  <Text className="text-destructive text-sm px-1 pt-1">{error}</Text>
)}
```

- [ ] **Step 6: Verify — open an idea, edit the title, tap elsewhere**

Run the app. Open any idea. Edit the title. Tap on the description field (this blurs the title). Confirm the title saves without pressing any button. Then kill the network and try to save — confirm the title reverts and the error text appears.

- [ ] **Step 7: Commit**

```bash
git add app/(app)/ideas/[id].tsx
git commit -m "feat: blur-to-save with optimistic rollback on idea detail screen"
```

---

## Task 2: GoalDetail — inline title and deadline editing

**Files:**
- Modify: `app/(app)/goals/[id].tsx`

This screen currently shows `goal?.title` in a static `<Text>` and routes deadline editing through `EditGoalModal`. We're adding inline `TextInput` for title and moving the `DatePicker` component inline.

- [ ] **Step 1: Find the DatePicker and toIsoDate imports in EditGoalModal**

Open `components/EditGoalModal.tsx`. Copy the import lines for `DatePicker` and `toIsoDate` exactly as they appear. You'll add these same imports to `app/(app)/goals/[id].tsx` in the next step.

- [ ] **Step 2: Update imports in goals/[id].tsx**

Add `TextInput` to the React Native import (if not already there).

Add the `DatePicker` import you copied from EditGoalModal.

Add the `toIsoDate` import you copied from EditGoalModal.

Remove the `EditGoalModal` import line.

- [ ] **Step 3: Remove edit modal state, add inline state and refs**

Remove these two state declarations:
```tsx
const [editVisible, setEditVisible] = useState(false);
const [editSnapshot, setEditSnapshot] = useState<typeof goal>(undefined);
```

Add in their place:
```tsx
const [title, setTitle] = useState('');
const [deadline, setDeadline] = useState<Date | null>(null);
const [error, setError] = useState<string | null>(null);
const savedTitle = useRef('');
const savedDeadline = useRef<Date | null>(null);
```

Also add `useRef` to the React import if not already present.

- [ ] **Step 4: Add a useEffect to initialize title and deadline from goal**

Add this effect below the existing data-loading effects:

```tsx
useEffect(() => {
  if (goal) {
    setTitle(goal.title);
    savedTitle.current = goal.title;
    const parsed = goal.deadline ? new Date(goal.deadline) : null;
    setDeadline(parsed);
    savedDeadline.current = parsed;
  }
}, [goal?.id]);
```

- [ ] **Step 5: Add handleTitleBlur and handleDeadlineChange**

```tsx
const handleTitleBlur = async () => {
  const trimmed = title.trim();
  if (!trimmed || trimmed === savedTitle.current) return;
  const previous = savedTitle.current;
  const err = await update(id, { title: trimmed });
  if (err) {
    setTitle(previous);
    setError(err);
  } else {
    savedTitle.current = trimmed;
    setError(null);
  }
};

const handleDeadlineChange = async (newDeadline: Date | null) => {
  const previous = savedDeadline.current;
  setDeadline(newDeadline);
  const err = await update(id, {
    deadline: newDeadline ? toIsoDate(newDeadline) : null,
  });
  if (err) {
    setDeadline(previous);
    setError(err);
  } else {
    savedDeadline.current = newDeadline;
    setError(null);
  }
};
```

- [ ] **Step 6: Update the header — remove pencil Pressable**

Find this Pressable in the header and delete it:

```tsx
<Pressable onPress={() => { setEditSnapshot(goal); setEditVisible(true); }} accessibilityRole="button" accessibilityLabel="Edit goal">
  <Ionicons name="pencil-outline" size={20} color={colors.primary} />
</Pressable>
```

The header's right side should now contain only the trash icon Pressable.

- [ ] **Step 7: Replace static title Text with TextInput**

Find where `goal?.title` is displayed as a `<Text>` in the ScrollView (likely near the top of the content area). Replace it with:

```tsx
<TextInput
  value={title}
  onChangeText={setTitle}
  onBlur={handleTitleBlur}
  className="text-2xl font-bold text-foreground font-rounded"
  accessibilityLabel="Goal title"
  returnKeyType="done"
/>
```

Add the error text directly below this TextInput:

```tsx
{error && (
  <Text className="text-destructive text-sm pt-1 pb-2">{error}</Text>
)}
```

- [ ] **Step 8: Add DatePicker inline where deadline is currently displayed**

Find where `goal?.deadline` is currently shown (likely a formatted Text in a section). Replace it with:

```tsx
<DatePicker
  value={deadline}
  onChange={handleDeadlineChange}
  mode="date"
  placeholder="No deadline"
  compact
/>
```

- [ ] **Step 9: Remove EditGoalModal from JSX**

Find and delete the `<EditGoalModal ... />` JSX element at the bottom of the return statement.

- [ ] **Step 10: Verify**

Run the app. Open a goal. Edit the title and blur — confirm it saves. Tap the deadline picker, change the date — confirm it saves. Verify the pencil icon is gone from the header.

- [ ] **Step 11: Commit**

```bash
git add app/(app)/goals/[id].tsx
git commit -m "feat: blur-to-save inline editing on goal detail screen"
```

---

## Task 3: ProjectDetail — inline title and main_goal editing

**Files:**
- Modify: `app/(app)/projects/[id].tsx`

Same pattern as Task 2 but simpler — two text fields, no DatePicker.

- [ ] **Step 1: Update imports in projects/[id].tsx**

Add `TextInput` to the React Native import if not already there.

Remove the `EditProjectModal` import line.

- [ ] **Step 2: Remove edit modal state, add inline state and refs**

Remove these two state declarations:
```tsx
const [editVisible, setEditVisible] = useState(false);
const [editSnapshot, setEditSnapshot] = useState<typeof project>(undefined);
```

Add in their place:
```tsx
const [title, setTitle] = useState('');
const [mainGoal, setMainGoal] = useState('');
const [error, setError] = useState<string | null>(null);
const savedTitle = useRef('');
const savedMainGoal = useRef('');
```

Also add `useRef` to the React import if not already present.

Note: `saving` state already exists in this file for AI planning — leave it untouched.

- [ ] **Step 3: Add a useEffect to initialize title and mainGoal from project**

Add this effect below the existing data-loading effects:

```tsx
useEffect(() => {
  if (project) {
    setTitle(project.title);
    savedTitle.current = project.title;
    setMainGoal(project.main_goal ?? '');
    savedMainGoal.current = project.main_goal ?? '';
  }
}, [project?.id]);
```

- [ ] **Step 4: Add handleTitleBlur and handleMainGoalBlur**

```tsx
const handleTitleBlur = async () => {
  const trimmed = title.trim();
  if (!trimmed || trimmed === savedTitle.current) return;
  const previous = savedTitle.current;
  const err = await update(id, { title: trimmed });
  if (err) {
    setTitle(previous);
    setError(err);
  } else {
    savedTitle.current = trimmed;
    setError(null);
  }
};

const handleMainGoalBlur = async () => {
  const trimmed = mainGoal.trim() || null;
  const savedTrimmed = savedMainGoal.current.trim() || null;
  if (trimmed === savedTrimmed) return;
  const previous = savedMainGoal.current;
  const err = await update(id, { main_goal: trimmed });
  if (err) {
    setMainGoal(previous);
    setError(err);
  } else {
    savedMainGoal.current = mainGoal;
    setError(null);
  }
};
```

- [ ] **Step 5: Update the header — remove pencil Pressable**

Find and delete this Pressable:

```tsx
<Pressable onPress={() => { setEditSnapshot(project); setEditVisible(true); }} accessibilityRole="button" accessibilityLabel="Edit project">
  <Ionicons name="pencil-outline" size={20} color={colors.primary} />
</Pressable>
```

- [ ] **Step 6: Replace static title Text with TextInput**

Find where `project?.title` is displayed as a `<Text>`. Replace it with:

```tsx
<TextInput
  value={title}
  onChangeText={setTitle}
  onBlur={handleTitleBlur}
  className="text-2xl font-bold text-foreground font-rounded"
  accessibilityLabel="Project title"
  returnKeyType="done"
/>
```

Add error text directly below:

```tsx
{error && (
  <Text className="text-destructive text-sm pt-1 pb-2">{error}</Text>
)}
```

- [ ] **Step 7: Replace static main_goal Text with TextInput**

Find where `project?.main_goal` is displayed as a `<Text>`. Replace it with:

```tsx
<TextInput
  value={mainGoal}
  onChangeText={setMainGoal}
  onBlur={handleMainGoalBlur}
  multiline
  className="text-foreground"
  placeholder="What is this project trying to achieve?"
  placeholderTextColor={colors.muted}
  accessibilityLabel="Project main goal"
/>
```

- [ ] **Step 8: Remove EditProjectModal from JSX**

Find and delete the `<EditProjectModal ... />` JSX element at the bottom of the return statement.

- [ ] **Step 9: Verify**

Run the app. Open a project. Edit the title, blur — confirm it saves. Edit the main goal, blur — confirm it saves. Verify no pencil icon in the header.

- [ ] **Step 10: Commit**

```bash
git add app/(app)/projects/[id].tsx
git commit -m "feat: blur-to-save inline editing on project detail screen"
```
