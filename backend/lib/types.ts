import Database from "better-sqlite3";
import { IncomingMessage, ServerResponse } from "node:http";

export type RouteHandler = (req: IncomingMessage, res: ServerResponse, db: Database.Database) => Promise<void>

export interface TelemetryEvent {
  id: string;
  deviceId: string;
  eventKind: string;
  createdAt: number;
  parameters: Record<string, string>;
}

export function guardDataIsTelemetryEventList(data: unknown): data is TelemetryEvent[] {
  return (
    Array.isArray(data) &&
    data.every((item: unknown) => (
      item !== null &&
      typeof item === 'object' &&
      "id" in item &&
      typeof item.id === 'string' &&
      "deviceId" in item &&
      typeof item.deviceId === 'string' &&
      "eventKind" in item &&
      typeof item.eventKind === 'string' &&
      "createdAt" in item &&
      typeof item.createdAt === 'number' &&
      "parameters" in item &&
      item.parameters !== null &&
      typeof item.parameters === 'object' &&
      Object.entries(item.parameters).every(([key, value]) => typeof key === 'string' && typeof value === 'string')
    ))
  )
}

export interface TimeSeriesChartDataPoint {
  timestamp: number;
  valueType: string;
  value: number;
}

export function guardDataIsTimeSeriesChartDataPointList(data: unknown): data is TimeSeriesChartDataPoint[] {
  return (
    Array.isArray(data) &&
    data.slice(0, 1).every((point) => (
      point !== null &&
      typeof point === 'object' &&
      typeof point.timestamp === 'number' &&
      typeof point.valueType === 'string' &&
      typeof point.value === 'number'
    ))
  );
}

export interface ValueDistributionChartDataPoint {
  valueName: string;
  valueTotal: number;
}

export function guardDataIsValueDistributionChartDataPointList(data: unknown): data is ValueDistributionChartDataPoint[] {
  return (
    Array.isArray(data) &&
    data.slice(0, 1).every((point) => (
      point !== null &&
      typeof point === 'object' &&
      typeof point.valueName === 'string' &&
      typeof point.value === 'number'
    ))
  )
}
