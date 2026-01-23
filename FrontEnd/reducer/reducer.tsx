export type State = {
  link: string;
  jobID: string | null;
  status: "idle" | "queued" | "running" | "done" | "error";
  format: string;
  quality: string;
  message: string;
  downloadUrl: string | null;
  lockedSubmit: boolean;
  error: string | null;
};

export type Action =
  | {
      type: "SUBMIT";
      payload: { link: string; format: string; quality: string };
    }
  | { type: "RESET" }
  | {
      type: "ERROR";
      payload: {
        error: string;
      };
    }
  | { type: "JOB_UPDATE"; payload: JobPayload }
  | { type: "CONVERTING"; payload: { jobID: string } }
  | { type: "SUCCESS" };

export type JobPayload = {
  jobID: string;
  status: "queued" | "running" | "done" | "error";
  quality: string;
  progress?: number;
  message?: string;
  downloadUrl?: string | null;
  error?: string | null;
};

const initialState: State = {
  link: "",
  jobID: null,
  status: "idle",
  format: "mp3",
  quality: "192",
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
        format: action.payload.format,
        quality: action.payload.quality,
        message: "Submitted",
        downloadUrl: null,
        lockedSubmit: true,
        error: null,
      };

    case "JOB_UPDATE": {
      const j = action.payload;

      return {
        ...state,
        jobID: j.jobID,
        status: j.status,
        message: j.message ?? state.message,
        downloadUrl: j.downloadUrl ?? state.downloadUrl,
        error: j.error ?? null,
        lockedSubmit: j.status === "queued" || j.status === "running",
      };
    }

    case "CONVERTING": {
      return {
        ...state,
        jobID: action.payload.jobID,
        status: "running",
        message: "Starting converting...",
      };
    }

    case "SUCCESS": {
      return {
        ...state,
        status: "done",
        message: "Completed",
        lockedSubmit: false,
      };
    }

    case "ERROR": {
      return {
        ...state,
        link: "",
        jobID: null,
        status: "error",
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
