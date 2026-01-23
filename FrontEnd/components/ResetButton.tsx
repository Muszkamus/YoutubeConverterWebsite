import React from "react";
import { formats } from "../data/data";
import type { Action } from "../reducer/reducer";
type Format = keyof typeof formats;
type ResetButton = {
  dispatch: React.Dispatch<Action>;
  setFormat: React.Dispatch<React.SetStateAction<Format>>;
  setQuality: React.Dispatch<React.SetStateAction<string>>;
};

const ResetButton = ({ dispatch, setFormat, setQuality }: ResetButton) => {
  function handleReset() {
    dispatch({ type: "RESET" });
    setFormat("mp3");
    setQuality("192");
  }
  return <button onClick={handleReset}>Reset</button>;
};

export default ResetButton;
