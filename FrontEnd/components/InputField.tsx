"use client";

import "../styles/inputField.css";

type InputFieldProps = {
  url: string;
  setUrl: React.Dispatch<React.SetStateAction<string>>;
};

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
