const express = require("express");
const cors = require("cors");

const convertRoutes = require("./routes/convert.routes");
const jobsRoutes = require("./routes/jobs.routes");
const downloadRoutes = require("./routes/download.routes");

const app = express();

const { startCleanupLoop } = require("./services/jobs.store");
startCleanupLoop();

const allowed = new Set(
  (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowed.has(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json());

app.use("/api", convertRoutes);
app.use("/api", jobsRoutes);
app.use("/api", downloadRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

console.log(process.env.CORS_ORIGIN);
console.log(allowed);

module.exports = app;
