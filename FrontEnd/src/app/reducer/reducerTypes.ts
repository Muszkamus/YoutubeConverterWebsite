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

export type JobPayload = {
  jobID: string;
  status: "queued" | "running" | "done" | "error";
  quality: string;
  progress?: number;
  message?: string;
  downloadUrl?: string | null;
  error?: string | null;
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
