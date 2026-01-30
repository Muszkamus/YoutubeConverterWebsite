# Abuse Reduction

---

## 1. Rate limiting (IP + route)

Apply **route‑specific limits** instead of a global one.

**Recommended limits**

- `/api/convert` → **very low** (e.g. 5 requests / minute / IP)
- `/api/jobs/*` → **medium** (e.g. 60 requests / minute / IP)
- `/api/download/*` → **low–medium**

**Implementation**

- Use `express-rate-limit`
- Use different limiters per route
- Apply early, before heavy logic

**Why**

- Prevents spam job creation
- Reduces polling abuse
- Cheap and effective first line of defense

---

## 2. Bot friction (CAPTCHA / Turnstile)

Add **human verification** on the frontend and validate server‑side.

**Options**

- Cloudflare Turnstile (recommended)
- hCaptcha

**Why**

- Stops cheap automation even with IP rotation
- Minimal UX impact
- No need for user accounts

---

## 3. Hard caps on work

Enforce strict resource limits **before starting conversion**.

**Caps to enforce**

- Max video duration (e.g. 15–30 minutes)
- Max output file size
- Max concurrent jobs per IP (e.g. 1–2)
- Max total concurrent jobs (global)

**Why**

- Prevents long or expensive jobs
- Keeps system predictable under load

---

## 4. Reject worst offenders early

Only allow **direct video URLs**.

**Deny**

- Playlists (`list=` query)
- Channels or users (`/channel/`, `/@name`, `/c/`)
- Search pages (`/results`)

**Allow**

- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- `youtube.com/shorts/VIDEO_ID`

**Why**

- Eliminates high‑cost abuse patterns
- Simplifies validation logic

---

## 5. Job queue + concurrency control

Never spawn unlimited Docker containers.

**Approach**

- In‑memory queue
- Max N concurrent jobs (e.g. 2–4)
- Excess jobs remain queued

**Why**

- Prevents CPU/RAM exhaustion
- Predictable performance
- Required before public exposure

---

## 6. Lock Docker down

Limit container damage and resource abuse.

**Run containers with**

- Non‑root user
- CPU limits (`--cpus`)
- Memory limits (`--memory`)
- PID limits (`--pids-limit`)
- Read‑only filesystem (except output dir)

**Example**

```
docker run --rm \
  --cpus 1.5 \
  --memory 1g \
  --pids-limit 256 \
  -v <downloads>:/app/downloads \
  yt-converter
```

**Why**

- Prevents host abuse
- Limits blast radius of malicious jobs

---

## 7. Polling abuse mitigation

Polling can be abused heavily.

**Server**

- Enforce minimum poll interval
- Return `429 Too Many Requests` when exceeded

**Client**

- Exponential backoff
- Stop polling after terminal states

**Later**

- Replace polling with SSE or WebSockets

---

## 8. Logging + denylist

Track basic abuse signals.

**Log per IP**

- Job count
- Failure rate
- Average job duration

**Auto‑block**

- Excessive failures
- Too many concurrent jobs
- Repeated invalid requests

**Why**

- Detect slow‑burn attacks
- Enables automated blocking

---

## 9. Storage limits + cleanup safety

Always clean aggressively.

**Delete output on**

- Expiry
- Failure
- Timeout

**Add**

- Global storage cap (e.g. X GB)
- Delete oldest jobs when exceeded

**Why**

- Prevents disk exhaustion
- Protects long‑running servers

---

## Recommended implementation order

1. Rate limiting
2. Strict YouTube URL validation
3. Concurrency caps + queue
4. CAPTCHA / Turnstile
5. Docker resource limits

---
