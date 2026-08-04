# agents.md

## AI Usage Policy

AI is **allowed** in this repository, but it must be used responsibly. The goal is to help contributors work more effectively - not to replace understanding, ownership, or good engineering practices.

## What AI Is Not For

AI should not be used for:

* Refactoring entire systems or large subsystems without a contributor fully understanding and guiding the changes
* Building new features or components entirely through AI-generated code
* Creating meaningless commits or padding contribution history

## What AI Is For

AI is a tool for assisting contributors who already understand the work they are doing. Acceptable uses include:

* Generating boilerplate that follows existing patterns
* Creating first drafts that are reviewed, edited, and adapted by the contributor
* Helping debug issues or reason through a specific problem
* Writing repetitive or mechanical code that the contributor could reasonably write themselves

AI should remain a supporting tool, not the primary driver of development.

## Requirements for AI-Generated Code

### 1. You Must Understand It

Any AI-generated code that enters the repository must be fully understood by the contributor submitting it.

If you cannot explain what the code does during review, it does not belong in the codebase. AI is not a substitute for understanding!

### 2. It Must Be Marked

All AI-generated code must be wrapped with comments indicating where the generated section begins and ends, including the date and timestamp.

```
// Generated code starts here on [DATE-TIMESTAMP]:

// Generated code ends here on [DATE-TIMESTAMP]:
```

Example:

```js
// Generated code starts here on 2026-06-08T14:32:00Z:
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
// Generated code ends here on 2026-06-08T14:32:00Z:
```

### 3. It Must Fit the Codebase

AI-generated code must match the project's existing style, conventions, architecture, and patterns.

Do not commit AI output as-is if it does not fit. Review it, clean it up, and make it consistent with the surrounding code first.

## TL;DR

AI-assisted is fine. AI-driven is not.

Use AI to help you build - not to avoid understanding what you are building.
