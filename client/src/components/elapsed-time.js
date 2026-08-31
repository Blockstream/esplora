const UPDATE_INTERVAL_MS = 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_YEAR = 365 * MINUTES_PER_DAY;
const MINUTES_PER_MONTH = MINUTES_PER_YEAR / 12;

const passthrough = (parts, ...values) =>
  parts.reduce(
    (result, part, index) =>
      result + part + (index < values.length ? values[index] : ""),
    "",
  );

export const formatDuration = (
  durationMilliseconds,
  compact = false,
  t = passthrough,
) => {
  const diffMinutes = Math.max(
    0,
    Math.floor(durationMilliseconds / UPDATE_INTERVAL_MS),
  );
  const years = Math.floor(diffMinutes / MINUTES_PER_YEAR);
  const minutesAfterYears = diffMinutes % MINUTES_PER_YEAR;
  const months = Math.floor(minutesAfterYears / MINUTES_PER_MONTH);
  const minutesAfterMonths = Math.floor(
    minutesAfterYears - months * MINUTES_PER_MONTH,
  );
  const units = [
    [t`YEAR`, t`YEARS`, t`y`, years],
    [t`MONTH`, t`MONTHS`, t`mo`, months],
    [t`DAY`, t`DAYS`, t`d`, Math.floor(minutesAfterMonths / MINUTES_PER_DAY)],
    [
      t`HOUR`,
      t`HOURS`,
      t`h`,
      Math.floor((minutesAfterMonths % MINUTES_PER_DAY) / 60),
    ],
    [t`MINUTE`, t`MINUTES`, t`m`, minutesAfterMonths % 60],
  ];
  const parts = units
    .filter((unit) => unit[3] > 0)
    .slice(0, 2)
    .map(([singular, plural, abbreviation, value]) =>
      compact
        ? `${value}${abbreviation}`
        : `${value} ${value === 1 ? singular : plural}`,
    );

  if (compact) return parts.length ? parts.join(" ") : t`< 1m`;

  return parts.length ? parts.join(" ") : t`< 1 MINUTE`;
};

const formatElapsedTime = (timestamp, compact, t) => {
  const fromDate =
    timestamp < 1e12 ? new Date(timestamp * 1000) : new Date(timestamp);
  const duration = formatDuration(new Date() - fromDate, compact, t);

  if (compact) return duration;

  return t`${duration} AGO`;
};

const updateElapsedTime = (element) => {
  element.textContent = formatElapsedTime(
    element.elapsedTimeTimestamp,
    element.elapsedTimeCompact,
    element.elapsedTimeTranslator,
  );
};

const startElapsedTime = (vnode, timestamp, compact, t) => {
  vnode.elm.elapsedTimeTimestamp = timestamp;
  vnode.elm.elapsedTimeCompact = compact;
  vnode.elm.elapsedTimeTranslator = t;
  updateElapsedTime(vnode.elm);
  vnode.elm.elapsedTimeInterval = window.setInterval(
    () => updateElapsedTime(vnode.elm),
    UPDATE_INTERVAL_MS,
  );
};

const patchElapsedTime = (_, vnode, timestamp, compact, t) => {
  vnode.elm.elapsedTimeTimestamp = timestamp;
  vnode.elm.elapsedTimeCompact = compact;
  vnode.elm.elapsedTimeTranslator = t;
  updateElapsedTime(vnode.elm);
};

const stopElapsedTime = (vnode) => {
  window.clearInterval(vnode.elm.elapsedTimeInterval);
};

export const ElapsedTime = ({
  timestamp,
  compact = false,
  t = passthrough,
} = {}) => (
  <span
    hook-insert={(vnode) => startElapsedTime(vnode, timestamp, compact, t)}
    hook-postpatch={(oldVnode, vnode) =>
      patchElapsedTime(oldVnode, vnode, timestamp, compact, t)
    }
    hook-destroy={stopElapsedTime}
  >
    {formatElapsedTime(timestamp, compact, t)}
  </span>
);
