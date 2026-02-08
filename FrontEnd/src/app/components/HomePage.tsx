"use client";
import { Format, formats } from "../data/dataFORMATS";
import { info } from "../data/dataUI";
import { useEffect, useReducer, useState } from "react";
import { initialState, reducer } from "../reducer/reducer";
import ConvertButton from "../components/ConvertButton";
import InputField from "../components/InputField";
import "../styles/button.css";
import ResetButton from "./ResetButton";
import Accordion from "./Accordion";
import Spinner from "./Spinner";
import { BACKEND_BASE } from "../data/dataAPI";
import { useJobPolling } from "../hooks/useJobPolling";

export default function HomePage() {
  const [format, setFormat] = useState<Format>("mp3");
  const [quality, setQuality] = useState<string>("192");
  const [state, dispatch] = useReducer(reducer, initialState);
  const [url, setUrl] = useState<string>("");
  const { jobID, status, downloadUrl, error } = state;
  const isWorking = status === "queued" || status === "running";

  const fullDownloadUrl =
    downloadUrl && downloadUrl.startsWith("/")
      ? BACKEND_BASE + downloadUrl
      : downloadUrl;

  useJobPolling(jobID ?? null, dispatch);

  return (
    <>
      <div className="homepage">
        <h1>Youtube Converter</h1>
        <p>100% safe and Ad free YouTube Converter</p>
        <form
          className="inputDiv"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <InputField url={url} setUrl={setUrl} />
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
          <div className="quality">
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            >
              {formats[format].map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>
        {status === "idle" && (
          <ConvertButton
            url={url}
            format={format}
            quality={quality}
            state={state}
            dispatch={dispatch}
          />
        )}
        {isWorking && <Spinner />}
        {status === "done" && fullDownloadUrl && (
          <a className="downloadBtn" href={fullDownloadUrl} download>
            Download {state.format}
          </a>
        )}
        {status === "error" && (
          <ResetButton
            dispatch={dispatch}
            setUrl={setUrl}
            setFormat={setFormat}
            setQuality={setQuality}
          />
        )}
      </div>
      <Accordion data={info} />

      <div>
        <p>status: {status}</p>
        <p>error: {error}</p>
        https://www.youtube.com/watch?v=jKZ67l61Zho
      </div>
    </>
  );
}
