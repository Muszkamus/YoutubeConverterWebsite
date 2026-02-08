const express = require("express");
const cors = require("cors");

const convertRoutes = require("./routes/convert.routes");
const jobsRoutes = require("./routes/jobs.routes");
const downloadRoutes = require("./routes/download.routes");

const app = express();

const { startCleanupLoop } = require("./services/jobs.store");
startCleanupLoop();

const allowed = new Set([
  "https://uplixer.co.uk",
  "https://www.uplixer.co.uk",
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : []),
]);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/postman
      cb(null, allowed.has(origin));
    },
  }),
);
app.use(express.json());

app.use("/api", convertRoutes);
app.use("/api", jobsRoutes);
app.use("/api", downloadRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

module.exports = app;
