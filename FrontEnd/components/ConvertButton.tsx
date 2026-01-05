import React from "react";
import "../styles/button.css";
import type { Action, State } from "../reducer/reducer";

type InputFieldProps = {
  link: string;
  setLink: React.Dispatch<React.SetStateAction<string>>;
  state: State;
  dispatch: React.Dispatch<Action>;
};

const ConvertButton = ({ link, setLink, state, dispatch }: InputFieldProps) => {
  function submitLink(): void {
    const trimmed = link.trim();
    if (trimmed === "") return;
    // must start with www.youtube.com, if not return error message
    dispatch({ type: "START", payload: { link: trimmed } });
    console.log(state);
  }

  return (
    <div>
      <button className="button" onClick={submitLink}>
        Convert
      </button>
    </div>
  );
};

export default ConvertButton;
