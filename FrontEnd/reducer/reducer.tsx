export type State = {
  link: string;
  jobID: number | null;
  status: "idle" | "queued" | "running" | "done" | "error";
  progress: number;
  message: string;
  downloadUrl: string | null;
  lockedSubmit: boolean;
  error: string | null;
};

export type Action =
  | { type: "SUBMIT"; payload: { link: string } }
  | { type: "RESET" };

const initialState: State = {
  link: "",
  jobID: null,
  status: "idle",
  progress: 0,
  message: "",
  downloadUrl: null,
  lockedSubmit: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SUBMIT":
      return {
        ...state,
        link: action.payload.link,
        jobID: new Date().getTime(),
        status: "queued",
        progress: 0,
        message: "Submitted",
        downloadUrl: null,
        lockedSubmit: true,
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
