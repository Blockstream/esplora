import { formatEstimatedBlockTime } from "../lib/pending-block-details";

const UPDATE_INTERVAL_MS = 60 * 1000;

const updateExpectedBlockTime = (element) => {
  element.textContent = formatEstimatedBlockTime(
    element.expectedBlockTimestamp,
    element.expectedBlockTranslator,
  );
};

const startExpectedBlockTime = (vnode, timestamp, t) => {
  vnode.elm.expectedBlockTimestamp = timestamp;
  vnode.elm.expectedBlockTranslator = t;
  updateExpectedBlockTime(vnode.elm);
  vnode.elm.expectedBlockTimeInterval = window.setInterval(
    () => updateExpectedBlockTime(vnode.elm),
    UPDATE_INTERVAL_MS,
  );
};

const patchExpectedBlockTime = (_, vnode, timestamp, t) => {
  vnode.elm.expectedBlockTimestamp = timestamp;
  vnode.elm.expectedBlockTranslator = t;
  updateExpectedBlockTime(vnode.elm);
};

const stopExpectedBlockTime = (vnode) => {
  window.clearInterval(vnode.elm.expectedBlockTimeInterval);
};

export const ExpectedBlockTime = ({ timestamp, t } = {}) => (
  <span
    className="block-timestamp"
    hook-insert={(vnode) => startExpectedBlockTime(vnode, timestamp, t)}
    hook-postpatch={(oldVnode, vnode) =>
      patchExpectedBlockTime(oldVnode, vnode, timestamp, t)
    }
    hook-destroy={stopExpectedBlockTime}
  >
    {formatEstimatedBlockTime(timestamp, t)}
  </span>
);
