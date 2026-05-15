# MindVault UI/UX Improvement Proposal

Issue 9 asks for competitor research first, with no implementation until approval. These are proposed improvements only.

## Sources Reviewed

- Notion Projects/Tasks: database items can be viewed as table, board, timeline, calendar, list, or gallery layouts. Source: https://www.notion.com/en-gb/help/guides/getting-started-with-projects-and-tasks
- Notion Calendar: calendar items can be connected to databases and linked pages, with drag/drop scheduling updating the source database. Source: https://www.notion.com/en-gb/help/guides/getting-started-with-notion-calendar
- Todoist: Today, Upcoming, labels, filters, list/calendar/board views, and drag/drop planning. Source: https://www.todoist.com/features
- Todoist Board/Upcoming docs: board/calendar switching and week planning are strong organizing patterns. Sources: https://get.todoist.help/hc/en-us/articles/360013988740-How-to-use-board-view and https://get.todoist.help/hc/en-us/articles/360000031019-How-to-plan-your-week
- TickTick: combines to-do list, calendar views, Pomodoro, habits, and progress tracking. Source: https://ticktick.com/?language=en_us
- Obsidian: backlinks and graph/local-graph patterns reveal relationships between notes. Sources: https://obsidian.md/help/plugins/backlinks and https://help.obsidian.md/link-notes
- Fantastical: strong calendar-first scheduling UX with fast availability/scheduling flows. Source: https://apps.apple.com/us/app/718043190

## Proposed Improvements

### 1. Add a real Inbox / Capture queue

MindVault should separate raw capture from organized ideas. Add an **Inbox** section on Home for ideas without category, tags, project, or goal links.

Why: Todoist and Things-style capture works because the user can dump thoughts quickly, then process later. This matches MindVault's "capture first, organise later" principle better than forcing every captured idea straight into the main Ideas archive.

### 2. Add "Today" and "Upcoming" planning views

Home should become more planning-oriented:

- Today: due tasks, today's events, and one resurfaced idea.
- Upcoming: next 7 days of tasks/events grouped by day.

Why: Todoist/TickTick/Fantastical all make time-based views central. MindVault currently has lists and a calendar, but not a focused daily command center.

### 3. Add relationship panels to every detail screen

Each detail screen should show compact linked-context panels:

- Idea: linked goals, projects, tasks, events.
- Goal: linked ideas, projects, tasks, events.
- Project: linked ideas, goals, tasks.
- Event: linked ideas, goals, tasks.
- Task: linked ideas, goals, event/project.

Why: Obsidian and Roam win because backlinks are visible exactly where the user is thinking. MindVault has relational data, but the UI should make those relationships feel like the product's spine.

### 4. Add a local "connection graph" for a single item

Do not build a full global graph first. Start with a local graph on detail screens: the current item in the center, direct links around it.

Why: Obsidian's global graph can become visual noise at scale, but local graph/backlink views are useful because they answer "what is connected to this thing right now?"

### 5. Add view switching on Projects and Goals

Projects should support:

- List view: current cards.
- Board view: grouped by status or priority.
- Timeline/calendar view: tasks/events by date.

Goals should support:

- Progress view: current goal cards.
- Task view: linked project tasks grouped by done/pending.

Why: Notion and Todoist both let users switch views without duplicating data. MindVault already has the relational schema to support this.

### 6. Make calendar items draggable later, but add "schedule from task" first

Before full drag/drop, add an explicit **Schedule** action on tasks that creates a calendar event and fills `tasks.calendar_event_id`.

Why: Notion Calendar and Todoist make scheduling feel direct. On mobile, a deliberate Schedule sheet will be more reliable than gesture-heavy drag/drop.

### 7. Improve empty states into action states

Current empty states are mostly explanatory. Upgrade them to offer the next best action:

- No ideas: "Capture idea"
- No goals: "Plan from idea" + "Create manually"
- No project tasks: "Add task" + "Plan with AI"
- No calendar events: "Schedule task" + "Create event"

Why: Great productivity apps reduce blank-screen paralysis by making the next move obvious.

### 8. Add command/search palette later

Add a global search/command entry point:

- Search ideas, goals, projects, tasks.
- Quick actions: capture idea, create task, schedule event, link current item.

Why: Notion, Obsidian, and Todoist all reward keyboard/fast-action workflows. On iPad especially, this will matter.

## Recommended Implementation Order

1. Relationship panels on detail screens.
2. Inbox / Capture queue.
3. Today + Upcoming sections on Home.
4. Schedule-from-task flow.
5. View switching for Projects/Goals.
6. Local graph for detail screens.
7. Command/search palette.

This order strengthens the existing app without ripping up Phase 4's architecture.
