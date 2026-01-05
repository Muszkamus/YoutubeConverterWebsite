The first step is designing the contract between UI and “the thing that converts”.

Do this before writing any implementation (mock or backend), otherwise you’ll refactor twice.

Step 1: Define your API contract (on paper, then as TypeScript types)

You want your UI to do exactly 4 things:

Send a YouTube URL

Receive a jobId immediately (so UI doesn’t hang)

Poll for status/progress using that jobId

Download the finished MP3 when ready

1. Decide the 3 endpoints (even if they’re mocked)

POST /convert
Input: { url }
Output: { jobId }

GET /status/:jobId
Output: { state, progress, message, downloadUrl?, error? }

GET /download/:jobId
Output: file stream (later), but for now: just a URL string in your mock

2. Decide the state machine (this prevents messy UI)

Pick a small set of states and never invent new ones later:

idle (nothing happening)

queued

running

done

error

Rules:

UI can only show progress when running

UI can only show a download link when done

UI can only show an error message when error

3. Decide the data shape (keep it stable)

Status response should always have the same keys:

jobId: string

state: "queued" | "running" | "done" | "error"

progress: number (0–100)

message: string (human readable)

downloadUrl?: string | null

error?: string | null

This stability is the whole point: you can swap mock ↔ backend later without touching UI logic.

4. Create a single “API module” boundary

Conceptually:

UI must not call fetch() everywhere.

UI calls one function: api.convert(url), api.status(jobId).

This is the learning-critical step: you’re designing clean separation.

What you should do now (concrete actions, no code)

Create a folder: src/lib/api/

Create two files:

types.ts (only types/interfaces for the contract)

index.ts (exports an api object; implementation comes later)

How to know you did Step 1 correctly

You can describe your API to someone in 30 seconds.

Your UI components don’t know or care if it’s mock or real.

You can build the UI flow fully using a fake implementation.
