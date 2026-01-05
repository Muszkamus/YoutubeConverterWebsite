import React from "react";
import "../styles/button.css";
import type { Action, State } from "../reducer/reducer";

type InputFieldProps = {
  url: string;
  state: State;
  dispatch: React.Dispatch<Action>;
};

const ConvertButton = ({ url, state, dispatch }: InputFieldProps) => {
  function submitLink(): void {
    const trimmed = url.trim();
    if (trimmed === "") return;

    // if (trimmed.startsWith("https://www.youtube.com/")) {
    dispatch({ type: "SUBMIT", payload: { link: trimmed } });
    console.log(state);
    //}
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
