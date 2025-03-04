import { IncomingMessage } from "node:http";
import type { RouteHandler } from "./types.ts";
import { ServerError } from "./server_error.ts";

const READ_AUTH_TOKEN = process.env.READ_AUTH_TOKEN;
const INGEST_AUTH_TOKEN = process.env.INGEST_AUTH_TOKEN;

if (READ_AUTH_TOKEN === undefined || INGEST_AUTH_TOKEN === undefined) {
  console.error(`Authentication tokens are not set correctly: READ_AUTH_TOKEN: ${READ_AUTH_TOKEN}, INGEST_AUTH_TOKEN: ${INGEST_AUTH_TOKEN}`);
  process.exit(1);
}

export function checkIngestPermissions(handler: RouteHandler): RouteHandler {
  return async (req, res, db) => {
    if (!hasValidAuthenticationToken(req, INGEST_AUTH_TOKEN!)) {
      throw new ServerError(403, "Unauthorized");
    }

    return handler(req, res, db);
  }
}

export function checkReadPermissions(handler: RouteHandler): RouteHandler {
  return async (req, res, db) => {
    if (!hasValidAuthenticationToken(req, READ_AUTH_TOKEN!)) {
      throw new ServerError(403, "Unauthorized");
    }

    return handler(req, res, db);
  }
}

function hasValidAuthenticationToken(req: IncomingMessage, token: string): boolean {
  const authHeader = req.headers.authorization;

  if (authHeader === undefined) {
    return false;
  }

  const [authType, value] = authHeader.split(' ');

  return authType === 'Bearer' && value === token;
}
