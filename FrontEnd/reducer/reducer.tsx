export type State = {
  link: string;
  jobID: string | null;
  status: "idle" | "queued" | "running" | "done" | "error";
  progress: number;
  message: string;
  downloadUrl: string | null;
  lockedSubmit: boolean;
  error: string | null;
};

export type Action =
  | { type: "SUBMIT"; payload: { link: string } }
  | { type: "RESET" }
  | {
      type: "ERROR";
      payload: {
        error: string;
      };
    }
  | { type: "CONVERTING"; payload: { jobID: string } };

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
        jobID: null,
        status: "queued",
        progress: 30,
        message: "Submitted",
        downloadUrl: null,
        lockedSubmit: true,
        error: null,
      };

    case "CONVERTING": {
      return {
        ...state,
        jobID: action.payload.jobID,
        status: "running",
        progress: 60,
        message: "Starting converting...",
      };
    }

    case "ERROR": {
      return {
        ...state,
        link: "",
        jobID: null,
        status: "error",
        progress: 0,
        message: "Error: Something went wrong",
        downloadUrl: null,
        lockedSubmit: false,
        error: action.payload.error,
      };
    }

    case "RESET":
      return initialState;

    default:
      const _exhaustive: never = action;
      return state;
  }
}

export { reducer, initialState };
