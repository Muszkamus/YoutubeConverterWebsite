"use client";

import React from "react";
import "../styles/button.css";
import type { Action, State } from "../reducer/reducer";

type ConvertButtonProps = {
  url: string;
  format: string;
  quality: string;
  state: State;
  dispatch: React.Dispatch<Action>;
};

const ConvertButton = ({
  url,
  format,
  quality,
  state,
  dispatch,
}: ConvertButtonProps) => {
  async function submitLink(): Promise<void> {
    const trimmed = url.trim();
    if (trimmed === "") return;
    if (trimmed === "https://www.youtube.com/") return;
    if (!trimmed.startsWith("https://www.youtube.com/")) return;
    // Add more safe guards
    dispatch({
      type: "SUBMIT",
      payload: {
        link: trimmed,
        format: format,
        quality: quality,
      },
    });
    // Set timeout for 5 seconds for each request
    const intervalID = setInterval(() => {}, 5000);
    // Make the request every 10 seconds
    try {
      const res = await fetch("http://localhost:8080/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          link: trimmed,
          codec: format,
          quality: quality,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      dispatch({ type: "CONVERTING", payload: { jobID: data.jobID } });
    } catch (err: any) {
      dispatch({ type: "ERROR", payload: { error: err.message } });
    }
  }

  return (
    <div>
      <button
        className="button"
        onClick={submitLink}
        disabled={state.lockedSubmit}
      >
        Convert
      </button>
    </div>
  );
};

export default ConvertButton;
