// hooks/useJobPolling.ts
import { useEffect } from "react";
import { BACKEND_BASE } from "../data/dataAPI";

// TODO
// Extract types

type Dispatch = (action: any) => void;

export function useJobPolling(jobID: string | null, dispatch: Dispatch) {
  useEffect(() => {
    if (!jobID) return;

    // AbortController allows cancelling in-flight fetches
    // (useful when jobID changes or component unmounts)

    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/jobs/${jobID}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Job not found (${res.status})`);

        const job = await res.json();
        dispatch({ type: "JOB_UPDATE", payload: job });

        if (job.status === "done" || job.status === "error") return;

        timeoutId = setTimeout(poll, 2000);
      } catch (e) {
        if (controller.signal.aborted) return;

        // Normalize error and forward to reducer/UI

        const msg = e instanceof Error ? e.message : JSON.stringify(e);
        dispatch({ type: "ERROR", payload: { error: msg } });
      }
    };

    poll();

    // Cleanup: abort fetch + clear pending timeout

    return () => {
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [jobID, dispatch]);
}
