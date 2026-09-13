#!/usr/bin/env node

const { execSync } = require('child_process');

/**
 * Closes every Claude Code Remote Control session started via
 * `pnpm claude:new-session` (matched by its "mobile-<timestamp>" name
 * prefix, assigned in that script's own command line). Deliberately does
 * NOT touch other `claude --remote-control` sessions — e.g. long-running,
 * manually named ones — only processes whose command line carries this
 * script's own naming convention.
 *
 * Killing the `claude` process is enough: `claude:new-session` wraps it in
 * `script(1)` purely to fake a TTY at startup, and `script` exits on its
 * own once the child it's monitoring exits.
 */
const SESSION_NAME_PREFIX = 'mobile-';

function findSessions() {
  try {
    const output = execSync(
      `pgrep -af "claude --remote-control ${SESSION_NAME_PREFIX}"`,
      { encoding: 'utf-8' },
    );
    return output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [pid, ...rest] = line.split(/\s+/);
        return { pid: Number(pid), cmd: rest.join(' ') };
      });
  } catch {
    // pgrep exits non-zero when nothing matches — not an error here.
    return [];
  }
}

function closeSessions() {
  const sessions = findSessions();

  if (sessions.length === 0) {
    console.log('No mobile Claude Code sessions running.');
    return;
  }

  for (const { pid, cmd } of sessions) {
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`Closed: ${cmd} (pid ${pid})`);
    } catch (error) {
      console.warn(`Could not close pid ${pid}:`, error.message);
    }
  }

  console.log(`✅ Closed ${sessions.length} session(s).`);
}

closeSessions();
