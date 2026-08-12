import { feeEstimateTargets, maxBlockWeight } from "../const";
import { feeRateClass } from "./fees";
import { clamp } from "./math";

const SEGWIT_MARKER_BYTE = "00";
const EMPTY_SEGWIT_FLAG_BYTE = "00";

const percentage = (value, limit) =>
  Number.isFinite(value) && Number.isFinite(limit) && limit > 0
    ? clamp((value / limit) * 100, 0, 100)
    : null;

const transactionVsize = (tx) =>
  tx && Number.isFinite(tx.weight) && tx.weight > 0
    ? Math.ceil(tx.weight / 4)
    : null;

const transactionHexSize = (txHex) =>
  typeof txHex === "string" && txHex.length % 2 === 0
    ? txHex.length / 2
    : null;

const isSegwitTransaction = (txHex) =>
  typeof txHex === "string" &&
  txHex.length >= 12 &&
  txHex.slice(8, 10) === SEGWIT_MARKER_BYTE &&
  txHex.slice(10, 12) !== EMPTY_SEGWIT_FLAG_BYTE;

const sumCompleteValues = (values) =>
  values.every(Number.isFinite)
    ? values.reduce((sum, value) => sum + value, 0)
    : null;

const summarizeFeeBucket = (transactions) => {
  if (!transactions.length) {
    return { count: 0, averageFeeRate: null, averageFee: null };
  }

  const totalFees = transactions.reduce((sum, tx) => sum + tx.fee, 0);
  const totalVsize = transactions.reduce((sum, tx) => sum + tx.vsize, 0);

  return {
    count: transactions.length,
    averageFeeRate: totalVsize > 0 ? totalFees / totalVsize : null,
    averageFee: totalFees / transactions.length,
  };
};

const summarizeFeeBuckets = (transactions, feeEst) => {
  if (
    !feeEst ||
    feeEst[feeEstimateTargets.average] == null ||
    feeEst[feeEstimateTargets.low] == null
  ) {
    return { low: null, medium: null, high: null };
  }

  if (
    !transactions.every(
      (tx) => Number.isFinite(tx.fee) && Number.isFinite(tx.vsize),
    )
  ) {
    return { low: null, medium: null, high: null };
  }

  const buckets = { success: [], warning: [], danger: [] };

  transactions.forEach((tx) => {
    const className = feeRateClass(tx.fee / tx.vsize, feeEst);
    if (buckets[className]) buckets[className].push(tx);
  });

  return {
    low: summarizeFeeBucket(buckets.success),
    medium: summarizeFeeBucket(buckets.warning),
    high: summarizeFeeBucket(buckets.danger),
  };
};

export const summarizeBlockTemplate = (template, feeEst) => {
  if (!template || !Array.isArray(template.transactions)) return null;

  const transactions = template.transactions
    .filter(Boolean)
    .map((tx) => ({
      ...tx,
      vsize: transactionVsize(tx),
      size: transactionHexSize(tx.data),
    }));
  const fees = transactions.map((tx) => tx.fee);
  const weights = transactions.map((tx) => tx.weight);
  const sizes = transactions.map((tx) => tx.size);
  const vsizes = transactions.map((tx) => tx.vsize);
  const totalFees = sumCompleteValues(fees);
  const totalWeight = sumCompleteValues(weights);
  const totalSize = sumCompleteValues(sizes);
  const totalVsize = sumCompleteValues(vsizes);
  const weightLimit = Number.isFinite(template.weightlimit)
    ? template.weightlimit
    : maxBlockWeight;
  const sizeLimit = Number.isFinite(template.sizelimit)
    ? template.sizelimit
    : null;
  const hasCompleteTransactionData = sizes.every(Number.isFinite);
  const segwitCount = hasCompleteTransactionData
    ? transactions.filter((tx) => isSegwitTransaction(tx.data)).length
    : null;
  const legacyCount = hasCompleteTransactionData
    ? transactions.length - segwitCount
    : null;

  return {
    height: Number.isFinite(template.height) ? template.height : null,
    updatedAt: Number.isFinite(template.curtime) ? template.curtime : null,
    templateTransactionCount: transactions.length,
    transactionCount: transactions.length + 1,
    totalFees,
    totalWeight,
    totalSize,
    weightLimit,
    sizeLimit,
    weightPercentage: percentage(totalWeight, weightLimit),
    sizePercentage: percentage(totalSize, sizeLimit),
    averageFeeRate:
      Number.isFinite(totalFees) && Number.isFinite(totalVsize) && totalVsize > 0
        ? totalFees / totalVsize
        : null,
    feeBuckets: summarizeFeeBuckets(transactions, feeEst),
    segwitCount,
    segwitPercentage: hasCompleteTransactionData
      ? transactions.length
        ? percentage(segwitCount, transactions.length)
        : 0
      : null,
    legacyPercentage: hasCompleteTransactionData
      ? transactions.length
        ? percentage(legacyCount, transactions.length)
        : 0
      : null,
  };
};
