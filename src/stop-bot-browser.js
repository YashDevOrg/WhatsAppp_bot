import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const sessionPath = `${process.cwd()}\\.wwebjs_auth\\session`;

const escapedSessionPath = sessionPath.replace(/\\/g, "\\\\");
const query = `CommandLine LIKE '%${escapedSessionPath}%'`;

try {
  const { stdout } = await execFileAsync("wmic", [
    "process",
    "where",
    query,
    "get",
    "ProcessId",
    "/value"
  ]);

  const processIds = stdout
    .split(/\r?\n/)
    .map((line) => line.match(/^ProcessId=(\d+)/)?.[1])
    .filter(Boolean);

  if (processIds.length === 0) {
    console.log("No bot browser processes found.");
    process.exit(0);
  }

  for (const processId of processIds) {
    await execFileAsync("taskkill", ["/PID", processId, "/T", "/F"]);
    console.log(`Stopped bot browser process ${processId}.`);
  }
} catch (error) {
  console.error("Failed to stop bot browser processes:", error.message);
  process.exit(1);
}
