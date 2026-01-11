"use client";

import React, { useReducer, useState } from "react";
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

  return (
    <>
      <div className="homepage">
        <InputField
          url={url}
          setUrl={setUrl}
          state={state}
          dispatch={dispatch}
        />
        <ConvertButton url={url} state={state} dispatch={dispatch} />
        <ResetButton dispatch={dispatch} />

        <div className="stateBox">
          <p>link: {link}</p>
          <p>jobId: {jobID}</p>
          <p>status: {status}</p>
          <p>progress: {progress}</p>
          <p>message: {message}</p>
          <p>downloadUrl: {downloadUrl}</p>
          <p>lockedSubmit: {lockedSubmit}</p>
          <p>error: {error}</p>
        </div>
      </div>
    </>
  );
};

export default HomePage;
