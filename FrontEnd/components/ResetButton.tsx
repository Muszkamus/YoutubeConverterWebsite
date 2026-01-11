import React from "react";

import type { Action } from "../reducer/reducer";

type ResetButton = {
  dispatch: React.Dispatch<Action>;
};

const ResetButton = ({ dispatch }: ResetButton) => {
  function handleReset() {
    dispatch({ type: "RESET" });
  }
  return <button onClick={handleReset}>Reset</button>;
};

export default ResetButton;
