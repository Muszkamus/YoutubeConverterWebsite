const express = require("express");
const cors = require("cors");

const convertRoutes = require("./routes/convert.routes");
const jobsRoutes = require("./routes/jobs.routes");
const downloadRoutes = require("./routes/download.routes");

const app = express();

const { startCleanupLoop } = require("./services/jobs.store");
startCleanupLoop();

app.use(cors());
app.use(express.json());

app.use("/api", convertRoutes);
app.use("/api", jobsRoutes);
app.use("/api", downloadRoutes);

module.exports = app;
