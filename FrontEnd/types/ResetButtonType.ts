import { formats } from "../data/data";
import { Action } from "../reducer/reducer";

export type Format = keyof typeof formats;
export type ResetButtonProps = {
  dispatch: React.Dispatch<Action>;
  setUrl: React.Dispatch<React.SetStateAction<string>>;
  setFormat: React.Dispatch<React.SetStateAction<Format>>;
  setQuality: React.Dispatch<React.SetStateAction<string>>;
};
