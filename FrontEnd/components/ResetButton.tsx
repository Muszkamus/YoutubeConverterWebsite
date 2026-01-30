"use client";

import { ResetButtonProps } from "../types/ResetButtonType";

const ResetButton = ({
  dispatch,
  setUrl,
  setFormat,
  setQuality,
}: ResetButtonProps) => {
  function handleReset() {
    dispatch({ type: "RESET" });
    setUrl("");
    setFormat("mp3");
    setQuality("192");
  }
  return <button onClick={handleReset}>Reset</button>;
};

export default ResetButton;
