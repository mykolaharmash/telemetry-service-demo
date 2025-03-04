import Database from "better-sqlite3";
import { IncomingMessage, ServerResponse } from "node:http";
import { ServerError } from "../lib/server_error.ts";
import { guardDataIsValueDistributionChartDataPointList } from "../lib/types.ts";


export async function colorsDistribution(
  req: IncomingMessage,
  res: ServerResponse,
  db: Database.Database
) {
  const selectEventsStatement = db.prepare(`
    SELECT
      value AS valueName,
      COUNT(*) AS value
    FROM events
    LEFT JOIN event_parameters ON event_parameters.event_id = events.id
    WHERE
      event_kind = 'circle-tapped' AND
      parameter_kind = 'color'
    GROUP BY valueName;
  `);

  const data = selectEventsStatement.all();

  if (!guardDataIsValueDistributionChartDataPointList(data)) {
    throw new ServerError(500, 'Report data returned by the DB does not correspond to the ValueDistributionChartDataPoint[] format')
  }

  res.statusCode = 200;
  res.write(JSON.stringify(data));
}
