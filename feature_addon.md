# Goal Tracker AI Assistant – Phase 2 Improvements

## Background

The Goal Tracker application currently uses an AI assistant that receives:

* Current routines
* Routine completion logs
* Tasks
* Task subtasks
* Task time logs

The assistant can currently:

* Answer questions about productivity history
* Create tasks
* Create routines
* Create subtasks
* Create time logs

The current implementation works well for basic task creation but lacks support for real-world productivity workflows such as editing tasks, prioritization, planning, and goal management.

The objective of this phase is to extend the assistant so it behaves more like an intelligent productivity coach rather than a simple task creator.

---

# Feature 1: Action Validation & Clarification Handling

## Problem

The AI may currently create actions using incorrect task references or make assumptions when multiple tasks match a user's request.

Example:

User:
"Add 1 hour to my ML task."

Existing tasks:

* Learn ML
* ML Thesis
* ML Interview Prep

The AI may arbitrarily choose one.

## Requirements

### Validation Rules

* CREATE_SUBTASK must only be generated when a valid task exists.
* CREATE_TIME_LOG must only be generated when a valid task exists.
* UPDATE actions must only reference valid IDs.
* DELETE actions must only reference valid IDs.

### Clarification Behaviour

If multiple tasks appear to match:

Example:

User:
"Add 1 hour to my ML task."

Response:

{
"reply": "Which task would you like to log time for: Learn ML, ML Thesis, or ML Interview Prep?",
"actions": []
}

The AI should prefer asking questions over guessing.

---

# Feature 2: Intent Classification

## Problem

Frontend logic currently has to infer user intent by inspecting generated actions.

## Goal

Introduce a top-level intent field.

### New Response Structure

{
"intent": "CHAT",
"reply": "...",
"actions": []
}

### Supported Intents

* CHAT
* CREATE_TASK
* CREATE_ROUTINE
* CREATE_SUBTASK
* CREATE_TIME_LOG
* UPDATE_TASK
* DELETE_TASK
* COMPLETE_TASK
* ANALYTICS
* MULTI_ACTION

### Examples

User:
"Create a task called Learn React"

Intent:

CREATE_TASK

User:
"How much time did I spend studying?"

Intent:

ANALYTICS

User:
"Create a task and log 2 hours"

Intent:

MULTI_ACTION

---

# Feature 3: Task & Routine Management Actions

## Problem

Users can create entities but cannot modify them.

## Goal

Add full lifecycle management.

### New Actions

#### UPDATE_TASK

{
"type": "UPDATE_TASK",
"payload": {
"taskId": "123",
"title": "Updated Title",
"description": "Updated Description"
}
}

#### DELETE_TASK

{
"type": "DELETE_TASK",
"payload": {
"taskId": "123"
}
}

#### COMPLETE_TASK

{
"type": "COMPLETE_TASK",
"payload": {
"taskId": "123"
}
}

#### UPDATE_ROUTINE

{
"type": "UPDATE_ROUTINE",
"payload": {
"routineId": "456",
"title": "Morning Workout"
}
}

#### DELETE_ROUTINE

{
"type": "DELETE_ROUTINE",
"payload": {
"routineId": "456"
}
}

#### COMPLETE_SUBTASK

{
"type": "COMPLETE_SUBTASK",
"payload": {
"subtaskId": "789"
}
}

### Natural Language Examples

"Rename my ML task to Deep Learning"

→ UPDATE_TASK

"Delete my old gym routine"

→ DELETE_ROUTINE

"Mark thesis as done"

→ COMPLETE_TASK

---

# Feature 4: Due Dates & Scheduling

## Problem

The assistant currently ignores scheduling information.

## Goal

Extract deadlines and dates whenever possible.

### Examples

User:
"Add gym tomorrow"

Result:

{
"title": "Gym",
"dueDate": "2026-06-10"
}

User:
"Finish thesis next Monday"

Result:

{
"title": "Finish Thesis",
"dueDate": "2026-06-15"
}

User:
"Submit application on June 20"

Result:

{
"title": "Submit Application",
"dueDate": "2026-06-20"
}

### Supported Inputs

* tomorrow
* today
* tonight
* next Monday
* next week
* June 20
* specific dates

### Schema Addition

{
"title": "Task",
"description": "",
"dueDate": "ISO_DATE"
}

---

# Feature 5: Priority Extraction

## Problem

Task urgency is currently lost.

## Goal

Automatically identify priority from user language.

### Supported Priorities

* LOW
* MEDIUM
* HIGH
* CRITICAL

### Examples

User:
"Urgently finish my thesis"

Priority:

CRITICAL

User:
"Eventually learn Docker"

Priority:

LOW

User:
"Important task for work"

Priority:

HIGH

### Schema Addition

{
"title": "Task",
"priority": "HIGH"
}

Default priority should be MEDIUM when not specified.

---

# Feature 6: Goal System

## Problem

The application currently stores only tasks and routines.

There is no concept of a long-term objective.

## Goal

Introduce Goals as a first-class entity.

### Goal Structure

{
"type": "CREATE_GOAL",
"payload": {
"title": "Pass German B2",
"description": "",
"targetDate": "2026-10-01"
}
}

### Example Goals

* Pass German B2
* Complete Master's Thesis
* Get Data Scientist Job
* Lose 10kg
* Build SaaS Product

### Future Relationship Model

Goal
├── Tasks
├── Subtasks
├── Routines
└── Time Logs

The AI should recognize goal-oriented language.

Examples:

"I want to pass B2 German by October"

→ CREATE_GOAL

"My goal is to complete my thesis by September"

→ CREATE_GOAL

---

# Success Criteria

The assistant should be able to:

1. Understand user intent explicitly.
2. Safely validate task references.
3. Edit, delete, and complete tasks.
4. Extract dates and deadlines.
5. Extract task priority.
6. Create long-term goals.
7. Manage task dependencies.
8. Ask clarifying questions when ambiguity exists.
9. Return structured actions that can be executed directly by the backend.
