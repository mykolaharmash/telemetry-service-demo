import Database from "better-sqlite3";
import { IncomingMessage, ServerResponse } from "node:http";
import { guardDataIsTimeSeriesChartDataPointList } from "../lib/types.ts";
import { ServerError } from "../lib/server_error.ts";

export async function colorsOverTime(
  req: IncomingMessage,
  res: ServerResponse,
  db: Database.Database
) {
  const selectEventsStatement = db.prepare(`
    SELECT
      CAST(round(created_at / 60) * 60 AS INTEGER) AS timestamp,
      value AS valueType,
      COUNT(*) AS value
    FROM events
    LEFT JOIN event_parameters ON event_parameters.event_id = events.id
    WHERE
      event_kind = 'circle-tapped' AND
      parameter_kind = 'color' AND
      created_at > unixepoch('now') - 10 * 60
    GROUP BY timestamp, valueType;
  `);

  const data = selectEventsStatement.all();

  if (!guardDataIsTimeSeriesChartDataPointList(data)) {
    throw new ServerError(500, 'Data returned by the DB does not correspond to the TimeSeriesChartDataPoint[] format')
  }

  res.statusCode = 200;
  res.write(JSON.stringify(data));
}
