const fs = require("fs");

function safeRmDir(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch {}
}

module.exports = { safeRmDir };
