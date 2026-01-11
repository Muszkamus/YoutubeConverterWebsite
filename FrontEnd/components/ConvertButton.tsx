"use client";

import React from "react";
import "../styles/button.css";
import type { Action, State } from "../reducer/reducer";

type ConvertButtonProps = {
  url: string;
  state: State;
  dispatch: React.Dispatch<Action>;
};

const ConvertButton = ({ url, state, dispatch }: ConvertButtonProps) => {
  async function submitLink(): Promise<void> {
    const trimmed = url.trim();
    if (trimmed === "") return;

    dispatch({ type: "SUBMIT", payload: { link: trimmed } });

    try {
      const res = await fetch("http://localhost:8080/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ link: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      console.log(data);

      // Later: dispatch more based on response (e.g., jobID, progress)
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
