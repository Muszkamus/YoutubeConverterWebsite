"use client";

import React, { useEffect, useReducer, useState } from "react";
import { initialState, reducer } from "../reducer/reducer";
import ConvertButton from "../components/ConvertButton";
import InputField from "../components/InputField";

import "../styles/state.css";
import ResetButton from "./ResetButton";

const HomePage = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [url, setUrl] = useState("");

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
        <InputField url={url} setUrl={setUrl} />
        <ConvertButton url={url} state={state} dispatch={dispatch} />
        <ResetButton dispatch={dispatch} />

        {status === "done" && fullDownloadUrl && (
          <a className="" href={fullDownloadUrl} download>
            Download MP3
          </a>
        )}

        <div className="stateBox">
          <p>status: {status}</p>
          <p>message: {message}</p>
          https://www.youtube.com/watch?v=Vk4t8wUKnbI
        </div>
      </div>
    </>
  );
};

export default HomePage;
