import { Interval } from "../types";

export function getMillisecondsFromInterval(interval: Interval): number {
  return interval.hours * 60 * 60 * 1000 + interval.minutes * 60 * 1000 + interval.seconds * 1000;
}

export function get4HAgoDateTime() {
  const now = new Date();
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

  return fourHoursAgo;
}