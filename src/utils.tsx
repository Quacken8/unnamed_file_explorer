import { AwaitedSignal } from "@mod.js/signals";
import { FileSize } from "./bindings";
import dayjs from "dayjs";

export function awaited<T>(
  signal: AwaitedSignal<T>,
  placeholder?: JSX.Element
) {}

const sizeUnits = [
  "B",
  "KB",
  "MB",
  "GB",
  "TB",
  "PB",
  "EB",
  "ZB",
  "YB",
] as const;
export function formatSize(size: FileSize): string {
  return `${size.size.toFixed(2)} ${sizeUnits[size.order]}`;
}

const isToday = (d: dayjs.Dayjs) => dayjs().isSame(d, "day");
const isYesterday = (d: dayjs.Dayjs) =>
  dayjs().subtract(1, "day").isSame(d, "day");
const isThisYear = (d: dayjs.Dayjs) => dayjs().year() === d.year();

export function formatEpochSeconds(date: number): string {
  const asDayjs = dayjs(new Date(date * 1000).toLocaleString());
  if (isToday(asDayjs)) {
    return asDayjs.format("HH:mm");
  } else if (isYesterday(asDayjs)) {
    return asDayjs.format("[yesterday at] HH:mm");
  } else if (isThisYear(asDayjs)) {
    return asDayjs.format("MMM D");
  } else {
    return asDayjs.format("MMM D, YYYY");
  }
}
