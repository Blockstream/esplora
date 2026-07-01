const UPDATE_INTERVAL_MS = 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_YEAR = 365 * MINUTES_PER_DAY;
const MINUTES_PER_MONTH = MINUTES_PER_YEAR / 12;

const formatElapsedTime = (timestamp) => {
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
    ["y", years],
    ["mo", months],
    ["d", Math.floor(minutesAfterMonths / MINUTES_PER_DAY)],
    ["h", Math.floor((minutesAfterMonths % MINUTES_PER_DAY) / 60)],
    ["m", minutesAfterMonths % 60],
  ];
  const parts = units
    .filter(([_, value]) => value > 0)
    .slice(0, 2)
    .map(([unit, value]) => `${value}${unit}`);

  return parts.length ? parts.join(" ") : "< 1m";
};

const updateElapsedTime = (element) => {
  element.textContent = formatElapsedTime(element.elapsedTimeTimestamp);
};

const startElapsedTime = (vnode, timestamp) => {
  vnode.elm.elapsedTimeTimestamp = timestamp;
  updateElapsedTime(vnode.elm);
  vnode.elm.elapsedTimeInterval = window.setInterval(
    () => updateElapsedTime(vnode.elm),
    UPDATE_INTERVAL_MS,
  );
};

const patchElapsedTime = (_, vnode, timestamp) => {
  vnode.elm.elapsedTimeTimestamp = timestamp;
  updateElapsedTime(vnode.elm);
};

const stopElapsedTime = (vnode) => {
  window.clearInterval(vnode.elm.elapsedTimeInterval);
};

export const ElapsedTime = ({ timestamp } = {}) => (
  <span
    hook-insert={(vnode) => startElapsedTime(vnode, timestamp)}
    hook-postpatch={(oldVnode, vnode) =>
      patchElapsedTime(oldVnode, vnode, timestamp)
    }
    hook-destroy={stopElapsedTime}
  >
    {formatElapsedTime(timestamp)}
  </span>
);
