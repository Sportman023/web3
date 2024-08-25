import { Interval } from "../types";

export function getMillisecondsFromInterval(interval: Interval): number {
  return interval.hours * 60 * 60 * 1000 + interval.minutes * 60 * 1000 + interval.seconds * 1000;
}