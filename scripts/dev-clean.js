#!/usr/bin/env node

const { execSync } = require('child_process');

/**
 * Local dev server ports. Keep in sync with apps/*\/package.json dev scripts
 * and .env.example (PORT, EXPRESS_INTERNAL_PORT).
 */
const DEV_PORTS = [
  { name: 'web', port: 3000 },
  { name: 'api (public)', port: 3001 },
  { name: 'dapp', port: 3003 },
  { name: 'api (internal)', port: 4001 },
  { name: 'mobile (metro)', port: 8081 },
];

/**
 * Kills any process listening on the given TCP port.
 * @param {number} port
 * @returns {number} number of processes killed
 */
function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf-8',
      });
      const pids = new Set(
        output
          .split('\n')
          .map((line) => line.trim().split(/\s+/).pop())
          .filter(Boolean),
      );
      for (const pid of pids) {
        execSync(`taskkill /PID ${pid} /F`);
      }
      return pids.size;
    }

    const output = execSync(`lsof -ti tcp:${port}`, {
      encoding: 'utf-8',
    }).trim();
    if (!output) return 0;
    const pids = output.split('\n').filter(Boolean);
    for (const pid of pids) {
      process.kill(Number(pid), 'SIGKILL');
    }
    return pids.length;
  } catch {
    // lsof/netstat/findstr exit non-zero when nothing matches the port — nothing to kill
    return 0;
  }
}

function closeAllDevServers() {
  console.log('🔌 Closing local dev servers...\n');

  let totalKilled = 0;
  for (const { name, port } of DEV_PORTS) {
    const killed = killPort(port);
    if (killed > 0) {
      console.log(
        `  Stopped ${name} on port ${port} (${killed} process${killed > 1 ? 'es' : ''})`,
      );
      totalKilled += killed;
    }
  }

  console.log(
    totalKilled > 0
      ? `\n✅ Closed ${totalKilled} process(es).`
      : '\n✅ Nothing was running.',
  );
}

if (require.main === module) {
  closeAllDevServers();
}

module.exports = { closeAllDevServers, killPort, DEV_PORTS };
