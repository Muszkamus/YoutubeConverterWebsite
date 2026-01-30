import { Action, State } from "../reducer/reducer";

export type ConvertButtonProps = {
  url: string;
  format: string;
  quality: string;
  state: State;
  dispatch: React.Dispatch<Action>;
};
