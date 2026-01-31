"use client";
import "../styles/inputField.css";

import { InputFieldProps } from "./InputFile.types";

const InputField = ({ url, setUrl }: InputFieldProps) => {
  return (
    <input
      onChange={(e) => setUrl(e.target.value)}
      value={url}
      className="input"
      placeholder="Enter YouTube link here"
    ></input>
  );
};

export default InputField;
