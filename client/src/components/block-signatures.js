import { parseBlockSignatures } from "../lib/block-signatures";

let lastWarningKey;

const warnOnce = (block, error) => {
  if (!process.browser) return;

  const source = error.source || "challenge";
  const warningKey = `${block && block.id}:${source}`;
  if (warningKey === lastWarningKey) return;

  lastWarningKey = warningKey;
  console.warn(`Failed to parse ${source} script`, error);
};

const BlockSignatures = ({ block }) => {
  const result = parseBlockSignatures(block);

  if (result && result.error) {
    warnOnce(block, result.error);
  }

  const signatures = result && !result.error ? result : null;

  return signatures ? (
    <div className="block-signatures">
      <p>{`${signatures.signatureCount} of ${signatures.totalSigners}`}</p>
      <p className="block-signatures-required">
        {`${signatures.requiredSignatures} required`}
      </p>
    </div>
  ) : (
    <p>N/A</p>
  );
};

export default BlockSignatures;
