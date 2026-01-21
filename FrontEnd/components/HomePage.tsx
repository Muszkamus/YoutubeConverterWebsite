"use client";
import formats from "../data/data";
import { useEffect, useReducer, useState } from "react";
import { initialState, reducer } from "../reducer/reducer";
import ConvertButton from "../components/ConvertButton";
import InputField from "../components/InputField";
import "../styles/button.css";
import "../styles/state.css";
import ResetButton from "./ResetButton";

const HomePage = () => {
  type Format = keyof typeof formats;

  const [format, setFormat] = useState<Format>("mp3");
  const [quality, setQuality] = useState<string>("192");
  const [state, dispatch] = useReducer(reducer, initialState);
  const [url, setUrl] = useState<string>("");

  const {
    link,
    jobID,
    status,
    progress,
    message,
    downloadUrl,
    lockedSubmit,
    error,
  } = state;

  const backendBase = "http://localhost:8080";

  const fullDownloadUrl =
    downloadUrl && downloadUrl.startsWith("/")
      ? backendBase + downloadUrl
      : downloadUrl;

  useEffect(() => {
    if (!jobID) return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`http://localhost:8080/api/jobs/${jobID}`);
        if (!res.ok) throw new Error("Job not found");
        const job = await res.json();

        if (cancelled) return;

        dispatch({ type: "JOB_UPDATE", payload: job }); // update status/progress/message/downloadUrl

        if (job.status === "done" || job.status === "error") return; // stop polling
      } catch (e) {
        // if (!cancelled) dispatch({ type: "ERROR", payload: String(e) });
      }

      if (!cancelled) setTimeout(poll, 2000);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [jobID]);

  return (
    <>
      <div className="homepage">
        <form
          className="inputDiv"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <InputField url={url} setUrl={setUrl} />
          <ConvertButton
            url={url}
            quality={quality}
            state={state}
            dispatch={dispatch}
          />
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

          <select value={quality} onChange={(e) => setQuality(e.target.value)}>
            {formats[format].map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
        <ResetButton dispatch={dispatch} />
        {status === "done" && fullDownloadUrl && (
          <a className="downloadBtn" href={fullDownloadUrl} download>
            Download MP3
          </a>
        )}

        <div className="stateBox">
          <p>status: {status}</p>
          <p>job ID: {jobID}</p>
          <p>quality: {quality}</p>
          <p>message: {message}</p>
          <p>error: {error}</p>
          https://www.youtube.com/watch?v=Vk4t8wUKnbI
        </div>
      </div>
    </>
  );
};

export default HomePage;
