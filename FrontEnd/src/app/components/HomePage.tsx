"use client";
import { Format, formats } from "../data/dataFORMATS";
import { info } from "../data/dataUI";
import { useEffect, useReducer, useState } from "react";
import { initialState, reducer } from "../reducer/reducer";
import ConvertButton from "../components/ConvertButton";
import InputField from "../components/InputField";
import "../styles/button.css";
import ResetButton from "./ResetButton";
import Accordion from "./Accordion";
import Spinner from "./Spinner";
import { BACKEND_BASE } from "../data/dataAPI";

export default function HomePage() {
  const [format, setFormat] = useState<Format>("mp3");
  const [quality, setQuality] = useState<string>("192");
  const [state, dispatch] = useReducer(reducer, initialState);
  const [url, setUrl] = useState<string>("");
  const { jobID, status, downloadUrl, error } = state;
  const isWorking = status === "queued" || status === "running";

  const fullDownloadUrl =
    downloadUrl && downloadUrl.startsWith("/")
      ? BACKEND_BASE + downloadUrl
      : downloadUrl;

  useEffect(() => {
    // Guard: don’t start polling without a valid job ID
    if (!jobID) return;

    // AbortController cancels in-flight fetches on unmount / job change
    const controller = new AbortController();

    // Track the polling timeout so it can be cleared on cleanup
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        // Poll backend for current job state
        const res = await fetch(`${BACKEND_BASE}/api/jobs/${jobID}`, {
          signal: controller.signal,
        });

        // Non-200 means job is invalid or backend error
        if (!res.ok) throw new Error(`Job not found (${res.status})`);

        const job = await res.json();

        // Update reducer with latest job status/progress
        dispatch({ type: "JOB_UPDATE", payload: job });

        // Terminal states: stop polling
        if (job.status === "done" || job.status === "error") return;

        // Schedule next poll
        timeoutId = setTimeout(poll, 2000);
      } catch (e) {
        // Ignore errors caused by intentional abort
        if (controller.signal.aborted) return;

        // Normalize error for reducer/UI
        const msg = e instanceof Error ? e.message : JSON.stringify(e);
        dispatch({ type: "ERROR", payload: { error: msg } });
      }
    };

    // Start polling immediately
    poll();

    // Cleanup: cancel fetch + clear scheduled timeout
    return () => {
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [jobID, BACKEND_BASE]);

  return (
    <>
      <div className="homepage">
        <h1>Youtube Converter</h1>
        <p>100% safe and Ad free YouTube Converter</p>
        <form
          className="inputDiv"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <InputField url={url} setUrl={setUrl} />
        </form>
        <div className="selectionDiv">
          <p className="text">Select the quality</p>

          <select
            value={format}
            onChange={(e) => {
              const f = e.target.value as Format;
              setFormat(f);
              setQuality(formats[f][0]); // reset quality safely
            }}
          >
            {Object.keys(formats).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <div className="quality">
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            >
              {formats[format].map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>
        {status === "idle" && (
          <ConvertButton
            url={url}
            format={format}
            quality={quality}
            state={state}
            dispatch={dispatch}
          />
        )}
        {isWorking && <Spinner />}
        {status === "done" && fullDownloadUrl && (
          <a className="downloadBtn" href={fullDownloadUrl} download>
            Download {state.format}
          </a>
        )}
        {status === "error" && (
          <ResetButton
            dispatch={dispatch}
            setUrl={setUrl}
            setFormat={setFormat}
            setQuality={setQuality}
          />
        )}
      </div>
      <Accordion data={info} />

      <div>
        {/* <p>status: {status}</p>

          <p>error: {error}</p> */}
        https://www.youtube.com/watch?v=jKZ67l61Zho
      </div>
    </>
  );
}
