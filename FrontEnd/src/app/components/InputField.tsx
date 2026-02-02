"use client";
import "../styles/inputField.css";

import { InputFieldProps } from "./InputField.types";

export default function InputField({ url, setUrl }: InputFieldProps) {
  return (
    <input
      onChange={(e) => setUrl(e.target.value)}
      type="url"
      value={url}
      autoComplete="off"
      className="input"
      placeholder="Enter YouTube link here"
    ></input>
  );
}
