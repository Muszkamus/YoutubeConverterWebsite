import { State, Action } from "../reducer/reducerTypes";

const initialState: State = {
  link: "",
  jobID: null,
  status: "idle",
  format: "mp3",
  quality: "192",

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
        format: action.payload.format,
        quality: action.payload.quality,
        downloadUrl: null,
        lockedSubmit: true,
        error: null,
      };

    case "JOB_UPDATE": {
      return {
        ...state,
        jobID: action.payload.jobID,
        status: action.payload.status,

        downloadUrl: action.payload.downloadUrl ?? state.downloadUrl,
        error: action.payload.error ?? null,
        lockedSubmit:
          action.payload.status === "queued" ||
          action.payload.status === "running",
      };
    }

    case "CONVERTING": {
      return {
        ...state,
        jobID: action.payload.jobID,
        status: "running",
      };
    }

    case "SUCCESS": {
      return {
        ...state,
        status: "done",

        lockedSubmit: false,
      };
    }

    case "ERROR": {
      return {
        ...state,
        link: "",
        jobID: null,
        status: "error",

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
