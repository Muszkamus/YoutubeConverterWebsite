const app = require("./app");

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "127.0.0.1"; // default: local-only

app.listen(PORT, HOST, () => {
  const showHost = HOST === "0.0.0.0" ? "localhost" : HOST;
  console.log(`Backend listening on http://${showHost}:${PORT}`);
});
