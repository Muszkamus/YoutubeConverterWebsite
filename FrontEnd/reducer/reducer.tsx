export type State = {
  link: string;
  jobId: number | null;
  status: "idle" | "typed" | "running" | "done" | "error";
  progress: number;
  message: string;
  downloadUrl: string | null;
  error: string | null;
};

export type Action =
  | { type: "START"; payload: { link: string } }
  | { type: "RESET" };

const initialState: State = {
  link: "",
  jobId: null,
  status: "idle",
  progress: 0,
  message: "",
  downloadUrl: null,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START":
      return {
        ...state,
        link: action.payload.link,
        jobId: new Date().getTime(),
        status: "typed",
        progress: 0,
        message: "Submitted",
        downloadUrl: null,
        error: null,
      };

    case "RESET":
      return initialState;

    default:
      const _exhaustive: never = action;
      return state;
  }
}

export { reducer, initialState };
