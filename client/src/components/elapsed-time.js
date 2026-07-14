const UPDATE_INTERVAL_MS = 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_YEAR = 365 * MINUTES_PER_DAY;
const MINUTES_PER_MONTH = MINUTES_PER_YEAR / 12;

const formatElapsedTime = (timestamp, compact) => {
  const fromDate =
    timestamp < 1e12 ? new Date(timestamp * 1000) : new Date(timestamp);
  const diffMinutes = Math.max(
    0,
    Math.floor((new Date() - fromDate) / UPDATE_INTERVAL_MS),
  );
  const years = Math.floor(diffMinutes / MINUTES_PER_YEAR);
  const minutesAfterYears = diffMinutes % MINUTES_PER_YEAR;
  const months = Math.floor(minutesAfterYears / MINUTES_PER_MONTH);
  const minutesAfterMonths = Math.floor(
    minutesAfterYears - months * MINUTES_PER_MONTH,
  );
  const units = [
    ["YEAR", "YEARS", "y", years],
    ["MONTH", "MONTHS", "mo", months],
    ["DAY", "DAYS", "d", Math.floor(minutesAfterMonths / MINUTES_PER_DAY)],
    [
      "HOUR",
      "HOURS",
      "h",
      Math.floor((minutesAfterMonths % MINUTES_PER_DAY) / 60),
    ],
    ["MINUTE", "MINUTES", "m", minutesAfterMonths % 60],
  ];
  const parts = units
    .filter((unit) => unit[3] > 0)
    .slice(0, 2)
    .map(([singular, plural, abbreviation, value]) =>
      compact
        ? `${value}${abbreviation}`
        : `${value} ${value === 1 ? singular : plural}`,
    );

  if (compact) return parts.length ? parts.join(" ") : "< 1m";

  return parts.length ? `${parts.join(" ")} AGO` : "< 1 MINUTE AGO";
};

const updateElapsedTime = (element) => {
  element.textContent = formatElapsedTime(
    element.elapsedTimeTimestamp,
    element.elapsedTimeCompact,
  );
};

const startElapsedTime = (vnode, timestamp, compact) => {
  vnode.elm.elapsedTimeTimestamp = timestamp;
  vnode.elm.elapsedTimeCompact = compact;
  updateElapsedTime(vnode.elm);
  vnode.elm.elapsedTimeInterval = window.setInterval(
    () => updateElapsedTime(vnode.elm),
    UPDATE_INTERVAL_MS,
  );
};

const patchElapsedTime = (_, vnode, timestamp, compact) => {
  vnode.elm.elapsedTimeTimestamp = timestamp;
  vnode.elm.elapsedTimeCompact = compact;
  updateElapsedTime(vnode.elm);
};

const stopElapsedTime = (vnode) => {
  window.clearInterval(vnode.elm.elapsedTimeInterval);
};

export const ElapsedTime = ({ timestamp, compact = false } = {}) => (
  <span
    hook-insert={(vnode) => startElapsedTime(vnode, timestamp, compact)}
    hook-postpatch={(oldVnode, vnode) =>
      patchElapsedTime(oldVnode, vnode, timestamp, compact)
    }
    hook-destroy={stopElapsedTime}
  >
    {formatElapsedTime(timestamp, compact)}
  </span>
);
