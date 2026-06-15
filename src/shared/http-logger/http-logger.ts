import morgan from 'morgan';

const STATUS_COLOR: Record<string, string> = {
  '2': '\x1b[32m',
  '3': '\x1b[36m',
  '4': '\x1b[33m',
  '5': '\x1b[31m',
};
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';

morgan.token('nest-format', (req, res) => {
  const method = req.method ?? '-';
  const url = req.url ?? '-';
  const status = res.statusCode?.toString() ?? '-';

  const color = STATUS_COLOR[status[0]] ?? RESET;
  const pid = process.pid;
  const now = new Date().toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    `${DIM}[Nest]${RESET} ${pid}  - ${now}     ` +
    `${color}${BOLD}LOG${RESET} ` +
    `${DIM}[HTTP]${RESET} ` +
    `${BOLD}${method}${RESET} ${url} ` +
    `${color}${status}${RESET}`
  );
});

const HEALTH_PATH = '/api/health';

function isHealthCheck(req: { url?: string }): boolean {
  const url = req.url ?? '';
  return url === HEALTH_PATH || url.startsWith(`${HEALTH_PATH}?`);
}

export const httpLogger = morgan(':nest-format', { skip: isHealthCheck });
