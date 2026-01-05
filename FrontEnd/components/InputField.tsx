"use client";

import "../styles/inputField.css";

type InputFieldProps = {
  state: any;
  dispatch: any;
  link: string;
  setLink: React.Dispatch<React.SetStateAction<string>>;
};

const InputField = ({ state, dispatch, link, setLink }: InputFieldProps) => {
  return (
    <input
      onChange={(e) => setLink(e.target.value)}
      value={link}
      className="input"
      placeholder="Enter YouTube link here"
    ></input>
  );
};

export default InputField;
