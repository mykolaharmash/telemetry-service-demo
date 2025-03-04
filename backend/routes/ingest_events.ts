import Database from "better-sqlite3";
import { IncomingMessage, ServerResponse } from "node:http";
import { readRequestBody } from "../lib/read_request_body.ts";
import { ServerError } from '../lib/server_error.ts';
import { guardDataIsTelemetryEventList } from '../lib/types.ts';

export async function ingestEvents(
  req: IncomingMessage,
  res: ServerResponse,
  db: Database.Database
) {
  const body = await readRequestBody(req);
  let bodyJson: unknown;

  try {
    bodyJson = JSON.parse(body)
  } catch (err) {
    throw new ServerError(400, "Request body is not valid JSON")
  }

  if (!guardDataIsTelemetryEventList(bodyJson)) {
    throw new ServerError(400, "Request body does not match the expected TelemetryEvent[] format");
  }

  const eventInsertStatement = db.prepare(`
    INSERT
    INTO events (id, device_id, event_kind, created_at)
    VALUES (:id, :deviceId, :eventKind, :createdAt)
    ;
  `);

  const eventParameterInsertStatement = db.prepare(`
    INSERT
    INTO event_parameters (event_id, parameter_kind, value)
    VALUES (:eventId, :parameterKind, :value)
    ;
  `);

    const transaction = db.transaction(() => {
      for (const event of bodyJson) {
        const {id, deviceId, eventKind, createdAt, parameters} = event;

        eventInsertStatement.run({ id, deviceId, eventKind, createdAt });

        for (const parameterKind in parameters) {
          const value = parameters[parameterKind];

          eventParameterInsertStatement.run({
            eventId: id,
            parameterKind,
            value: value === 'nil' ? null : value
          });
        }
      }
    });

    transaction();

    res.statusCode = 202;
}
