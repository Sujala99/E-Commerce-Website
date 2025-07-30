const fs = require("fs");
const path = require("path");

exports.logAdminAction = (adminId, action, endpoint) => {
  const logLine = `[${new Date().toISOString()}] ADMIN ${adminId}: ${action} at ${endpoint}\n`;
  fs.appendFileSync(path.join(__dirname, "../logs/admin.log"), logLine);
};
