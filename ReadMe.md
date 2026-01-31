# Project overview

This project is a job-based media conversion platform designed to safely convert YouTube content into **MP3 (audio)** or **MP4 (video)** formats.  
It is built with a clear separation of concerns: **frontend UI**, **backend API**, and a **controlled runtime environment** for media processing.

### The project consists of 3 apps

- Front End
- Back End
- Docker Image

---

## Front End

The frontend is responsible for **user interaction, job creation, and job state visualisation**.  
All conversion logic and file handling are delegated to the backend.

### React

React is used to build the frontend as a **component-based UI** with a clear and predictable data flow.

Why React fits this project:

- Declarative rendering driven by job state
- Well-suited for async, event-driven workflows (job polling)
- Scales cleanly as the UI grows
- Large ecosystem and long-term maintainability

Job handling is managed with a **reducer-based state model** rather than scattered local state.

This approach:

- Ensures consistent state updates from API responses
- Makes job lifecycle transitions explicit and predictable
- Supports multiple concurrent jobs without state corruption

Job lifecycle: (queued → running → done → failed → expired)

### Next.js

Next.js is used for:

- Server-side rendering (SSR)
- Improved initial load performance
- Structured routing and project layout

Important:

- SSR is used only for UI rendering
- All conversion logic remains client → backend API based

### TypeScript

TypeScript is mandatory in this project.

Why:

- Strong typing for job states and API responses
- Prevents invalid UI and reducer states
- Makes refactoring safe as the project grows

Used for:

- API contracts
- Reducer actions and state
- Component props
- Utility functions

### How to run

From the frontend directory:

Install dependencies:

```bash
npm i
```

Start the development server:

```bash
npm run dev
```

The app will be available on http://localhost:3000

---

## Backend
