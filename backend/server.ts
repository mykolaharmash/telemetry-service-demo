import http from 'node:http';
import { prepareDatabaseConnection } from './lib/prepare_database_connection.ts';
import { ingestEvents } from './routes/ingest_events.ts';
import { type RouteHandler } from './lib/types.ts';
import { checkIngestPermissions, checkReadPermissions } from './lib/auth.ts';
import { ServerError } from './lib/server_error.ts';
import { colorsOverTime } from './routes/colors_over_time.ts';
import { colorsDistribution } from './routes/colors_distribution.ts';

const HOST = process.env.HOST ?? '0.0.0.0';
const PORT = parseInt(process.env.PORT ?? '3000');

const db = prepareDatabaseConnection()

const server = http.createServer((req, res) => {
  if (req.method === undefined || req.url === undefined) {
    res.statusCode = 400;
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const requestSignature = `${req.method} ${url.pathname}`;

  let handler: RouteHandler;

  res.setHeader('Content-Type', 'application/json');

  switch (requestSignature) {
    case 'GET /hello':
      handler = async (_, res) => {
        res.statusCode = 200;
        res.write("Hello, World!")
      }
      break;

    case 'POST /events':
      handler = checkIngestPermissions(ingestEvents);
      break;

    case 'GET /colors-over-time':
      handler = checkReadPermissions(colorsOverTime);
      break;

    case 'GET /colors-distribution':
      handler = checkReadPermissions(colorsDistribution);
      break;

    default:
      handler = async (_, res) => { res.statusCode = 404 }
  }

  handler(req, res, db)
    .then(() => {
      console.log(`Response code: ${res.statusCode}`)
      return res
    })
    .catch((err: Error) => {
      res.statusCode = err instanceof ServerError ? err.statusCode : 500;
      res.write(JSON.stringify({ error: err.message }));
      console.error(err, res.statusCode);
    })
    .finally(() => res.end())
});

server.listen(PORT, HOST, () => {
  console.log(`Server is listening on ${HOST}:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.on('unhandledPromiseRejection', (reason) => {
  console.error('Unhandled promise rejection', reason);
});

function serverShutdown() {
  server.close(() => {
    console.log(`Server closed on ${HOST}:${PORT}`);
  });
}

server.on('SIGINT', serverShutdown);
server.on('SIGTERM', serverShutdown);
