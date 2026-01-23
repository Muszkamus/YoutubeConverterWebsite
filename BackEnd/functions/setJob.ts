const jobs = new Map(); // jobID -> {status, progress, message, downloadUrl, error, filePath, createdAt, updatedAt}

type setJob = {
  jobID: string;
};
function setJob(jobID, patch): void {
  const prev = jobs.get(jobID) ?? {
    status: "queued",
    progress: 0,
    message: "Queued",
    downloadUrl: null,
    error: null,
    filePath: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default setJob;
