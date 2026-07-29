// Bitcoin Core's default -maxmempool allocation is 300 MB:
// https://github.com/bitcoin/bitcoin/blob/b2c45888fde06429e86913fab5e7b7a075f091c3/src/kernel/mempool_options.h#L18-L19
const DEFAULT_MEMPOOL_LIMIT_BYTES = 300 * 1000 * 1000;

// This is an approximation: Esplora exposes total transaction vsize, not
// Bitcoin Core's dynamic in-memory usage or a node's configured -maxmempool.
export const getMempoolUsage = (mempool) =>
  mempool && Number.isFinite(mempool.vsize)
    ? Math.max(0, Math.min(1, mempool.vsize / DEFAULT_MEMPOOL_LIMIT_BYTES))
    : 0;

export const getMempoolCongestionLevel = (usage) => {
  if (usage < 1 / 3) return "Low";
  if (usage < 2 / 3) return "Moderate";
  return "High";
};

const congestionClassByLevel = {
  Low: "success",
  Moderate: "warning",
  High: "danger",
};

export const getMempoolCongestionClass = (level) =>
  congestionClassByLevel[level] || "";

export const getMempoolCongestion = (mempool) => {
  const usage = getMempoolUsage(mempool);
  const level = mempool ? getMempoolCongestionLevel(usage) : "";

  return {
    className: getMempoolCongestionClass(level),
    level,
    percentage: usage * 100,
  };
};
