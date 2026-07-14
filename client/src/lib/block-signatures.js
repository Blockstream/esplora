const OP_1 = 0x51;
const OP_16 = 0x60;
const OP_CHECKMULTISIG = 0xae;
const MIN_SIGNATURE_LENGTH = 9;
const MAX_SIGNATURE_LENGTH = 73;

const smallIntegerFromOpcode = (opcode) => {
  if (opcode < OP_1 || opcode > OP_16) {
    throw new Error("expected an OP_1 through OP_16 opcode");
  }

  return opcode - OP_1 + 1;
};

const bytesFromHex = (hex) => {
  if (
    typeof hex !== "string" ||
    !hex.length ||
    hex.length % 2 ||
    !/^[0-9a-f]+$/i.test(hex)
  ) {
    throw new Error("expected a non-empty, even-length hex string");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

const bytesFromArray = (values) => {
  if (!Array.isArray(values)) throw new Error("expected a byte array");

  if (
    values.some(
      (value) => !Number.isInteger(value) || value < 0 || value > 0xff,
    )
  ) {
    throw new Error("byte array contains an invalid value");
  }

  return new Uint8Array(values);
};

const parseChallenge = (challenge) => {
  if (challenge.length < 3) throw new Error("challenge script is too short");

  if (challenge[challenge.length - 1] !== OP_CHECKMULTISIG) {
    throw new Error("challenge does not end in OP_CHECKMULTISIG");
  }

  const requiredSignatures = smallIntegerFromOpcode(challenge[0]);
  const totalSigners = smallIntegerFromOpcode(
    challenge[challenge.length - 2],
  );

  if (requiredSignatures > totalSigners) {
    throw new Error("challenge requires more signatures than available keys");
  }

  return { requiredSignatures, totalSigners };
};

const validateSignatureLength = (length) => {
  if (length < MIN_SIGNATURE_LENGTH || length > MAX_SIGNATURE_LENGTH) {
    throw new Error("signature length is outside the DER ECDSA range");
  }
};

const addSignatureCount = (challenge, signatureCount) => {
  if (signatureCount > challenge.totalSigners) {
    return {
      error: new Error(
        "signature count exceeds the number of available keys",
      ),
    };
  }

  return { ...challenge, signatureCount };
};

const parseLegacySolution = (solution) => {
  if (!solution.length || solution[0] !== 0) {
    throw new Error("solution does not start with the CHECKMULTISIG dummy");
  }

  let offset = 1;
  let signatureCount = 0;

  while (offset < solution.length) {
    const signatureLength = solution[offset++];
    validateSignatureLength(signatureLength);

    if (offset + signatureLength > solution.length) {
      throw new Error("solution signature extends past the end of the script");
    }

    offset += signatureLength;
    signatureCount++;
  }

  return signatureCount;
};

const getLegacyProof = (block) => {
  if (block && block.proof && block.proof.challenge != null) {
    return block.proof;
  }
  if (block && block.ext && block.ext.challenge != null) return block.ext;
  return null;
};

const getSignblockWitness = (block) => {
  if (block?.ext?.signblock_witness != null) {
    return block?.ext?.signblock_witness;
  }

  return null;
};

const withSource = (source, parser) => {
  try {
    const result = parser();

    if (result.error) {
      result.error.source = source;
      return result;
    }

    return { ...result, source };
  } catch (error) {
    error.source = source;
    return { error };
  }
};

export const parseBlockSignatures = (block) => {
  if (!block) {
    return;
  }

  const witness = getSignblockWitness(block);

  if (witness != null) {
    return withSource("signblock_witness", () => {
      if (!Array.isArray(witness) || witness.length < 2) {
        throw new Error("signblock witness must contain a dummy and challenge");
      }

      const stack = witness.map(bytesFromArray);
      if (stack[0].length) {
        throw new Error("signblock witness dummy must be empty");
      }

      return addSignatureCount(
        parseChallenge(stack[stack.length - 1]),
        stack.length - 2,
      );
    });
  }

  return withSource("challenge", () => {
    const proof = getLegacyProof(block);
    if (!proof || proof.solution == null) {
      throw new Error("legacy block proof is missing challenge or solution");
    }

    return addSignatureCount(
      parseChallenge(bytesFromHex(proof.challenge)),
      parseLegacySolution(bytesFromHex(proof.solution)),
    );
  });
};
