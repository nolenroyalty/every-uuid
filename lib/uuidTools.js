import randomBytesSeed from '@csquare/random-bytes-seed';

const UUID_ENTROPY = 122n;
const UUID_COUNT = 1n << UUID_ENTROPY;
const BIT_MASK_FULL = UUID_COUNT - 1n;
const INDEX_OFFSET = 1237834238432n; // Random offset

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[4*][0-9a-f]{3}-[89ab*][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_PATTERN_REGEX = /^[0-9a-f*]{8}-[0-9a-f*]{4}-[4*][0-9a-f*]{3}-[89ab*][0-9a-f*]{3}-[0-9a-f*]{12}$/;
const DELIMITER_INDEXES = [8, 13, 18, 23];
const DISALLOWED_QUERY_CHARACTER = /[^a-f0-9-]/;

/** Wrapper for seeded random bytes */
class RandomBytes {
  constructor(seed) {
    this.seed = seed
  }
  next(bytes) {
    const output = randomBytesSeed(bytes, this.seed);
    this.seed = output;
    return output;
  }
}

const ENCRYPT_MATRIX = randomInvertibleMatrix(122, new RandomBytes('42'));
const INVERSE_ENCRYPT_MATRIX = invertMatrix(ENCRYPT_MATRIX);

/** Inverts a matrix, assumes it is invertible */
function invertMatrix(matrix) {
  const identity = Array(matrix.length).fill(0).map((_, i) => 1n << BigInt(i))
  const adjointMatrix = matrix.map((row, i) => ({ original: row, inverse: identity[i] }))

  for (let index = 0n; index < BigInt(adjointMatrix.length); index++) {
    // Find the row where the column bit is 1
    let rowIndex = undefined;
    for (let i = index; i < BigInt(adjointMatrix.length); i++) {
      if (((adjointMatrix[i].original >> index) & 1n) === 1n) {
        rowIndex = i;
        break;
      }
    }

    // Swap rowIndex with row
    const tempRow = adjointMatrix[index];
    adjointMatrix[index] = adjointMatrix[rowIndex];
    adjointMatrix[rowIndex] = tempRow;

    // Eliminate column from rows below
    for (let i = index + 1n; i < BigInt(adjointMatrix.length); i++) {
      if (((adjointMatrix[i].original >> index) & 1n) === 1n) {
        adjointMatrix[i].original ^= adjointMatrix[index].original;
        adjointMatrix[i].inverse ^= adjointMatrix[index].inverse;
      }
    }
  }

  // Eliminate column from rows above
  for (let index = BigInt(adjointMatrix.length) - 1n; index >= 0n; index--) {
    for (let i = index - 1n; i >= 0n; i--) {
      if (((adjointMatrix[i].original >> index) & 1n) === 1n) {
        adjointMatrix[i].original ^= adjointMatrix[index].original;
        adjointMatrix[i].inverse ^= adjointMatrix[index].inverse;
      }
    }
  }

  return adjointMatrix.map((value) => value.inverse);
}

/** Modulo operation avoiding JS's weird behaviour with negative numbers */
function modulo(value, modulus) {
  return value & (modulus - 1n);
}

/** Returns the rank of a matrix on GF(2) using Gaussian elimination */
function rank(matrix) {
  matrix = matrix.filter((row) => row > 0n)
  if (matrix.length === 0) return 0;

  const targetRow = matrix.find((row) => (row & 1n) === 1n);

  if (targetRow === undefined) {
    return rank(matrix.map((row) => row >> 1n))
  }

  return 1 + rank(
    matrix.map((row) => (row & 1n) > 0n ? (row ^ targetRow) >> 1n : row >> 1n)
  );
}

/** Returns if a matrix is full rank on GF(2) using gaussian elimination */
function isFullRank(matrix) {
  return rank(matrix) === matrix.length;
}

/** Returns a BigInt constructed from a Buffer of bytes */
function bytesToBigInt(bytes) {
  return BigInt(
    '0x' + Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, 0))
      .join('')
  );
}

/** Creates a random invertible matrix on GF(2) */
function randomInvertibleMatrix(size, randomGenerator) {
  let matrix
  while (true) {
    matrix = Array(size)
      .fill(0)
      .map((value) => {
        return bytesToBigInt(randomGenerator.next(16)) & BIT_MASK_FULL;
      })

    if (isFullRank(matrix)) return matrix
  }
}

/** Returns the count of the non-zero bits in a BigInt */
function countBits(value) {
  let count = 0n;
  while (value > 0n) {
    count += value & 1n;
    value = value >> 1n;
  }
  return count;
}

/** Encrypts an index to a UUID based on an encryption matrix */
function encrypt(value, matrix) {
  let encrypted = 0n
  for (let i = 0n; i < UUID_ENTROPY; i++) {
    encrypted = encrypted | ((countBits(matrix[i] & value) % 2n) << i)
  }
  return encrypted
}


/** Returns a string representation of a UUID value */
function uuidToString(value) {
  const result = (
    ((value >> 74n) << 80n) |
    (4n << 76n) |
    (((value >> 62n) & (1n << 12n) - 1n) << 64n) |
    (2n << 62n) |
    (value & (1n << 62n) - 1n)
  );

  const hex = result.toString(16).padStart(32, 0);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function uuidValueFromString(uuid) {
  if (!uuid.match(UUID_REGEX)) {
    throw new Error('Invalid UUID')
  }

  const value = BigInt('0x' + uuid.replace(/-/g, ''));

  return (
    (value & ((1n << 62n) - 1n)) |
    (((value >> 64n) & ((1n << 12n) - 1n)) << 62n) |
    ((value >> 80n) << 74n)
  );
}

/** Offets an index to avoid the first UUID being 0 */
function offsetIndex(index, offset) {
  return modulo(index + offset, UUID_COUNT);
}

/** Compares two values and returns if they are greater/lesser/equal */
function compareValues(x, y) {
  if (x === y) return 0;
  return x > y ? 1n : -1n;
}

/** Returns the distance between two values in a direction (1 or -1) */
function directionDistance(a, b, direction) {
  return modulo((b - a) * direction, UUID_COUNT);
}

/**
 * Masks bits up to an index
 * For example `maskIndex(0b1111n, 1n) === 0b1100n`
 * (The 0th and 1st bits are masked off)
 */
function maskIndex(index, bit) {
  return (index >> (bit + 1n)) << (bit + 1n);
}

/**
 * Finds a query by searching through consecutive indexes.
 * This is very fast for queries <= 2 characters.
 */
function nextIndexBruteForce(query, index, direction) {
  while(true) {
    index = modulo(index + direction, UUID_COUNT)
    if (indexToUUID(index).includes(query))  {
      return index
    }
  }
}

/**
 * Takes a hex character or asterisk
 *   - For a hex character returns a list of bits LSB first
 *   - For an asterisk returns a list of None (indicating unknown bits)
 */
function hexToBits(character) {
  if (character === '*') return [undefined, undefined, undefined, undefined]
  const value = BigInt('0x' + character);
  const bits = [];
  for (let i = 0n; i < 4n; i++) {
    bits.push((value >> i) & 1n);
  }
  return bits;
}

/** Returns if a UUID pattern is valid */
function patternIsValid(pattern) {
  if (pattern.length !== 36) return false;
  return Boolean(pattern.match(UUID_PATTERN_REGEX));
}

/** Replace a character in a string */
function replaceCharacter(value, index, character) {
  return value.slice(0, index) + character + value.slice(index + 1);
}

/** Returns a UUID pattern with asterisks replaced with hyphens appropriately */
function insertHyphens(pattern) {
  DELIMITER_INDEXES.forEach((index) => {
    if (pattern[index] === '*') pattern = replaceCharacter(pattern, index, '-');
  })
  return pattern;
}

/**
 * Takes a valid UUID pattern and returns an LSB first list of bits,
 * excluding fixed bits, where unknown bits '*' are undefined.
 */
function patternToBits(pattern) {
  const patternBits = Array.from(pattern.replace(/-/g, '')).reverse().map(hexToBits).flat(1);
  return patternBits.slice(0, 62).concat(patternBits.slice(64, 76)).concat(patternBits.slice(80))
}

/**
 * Takes an array of solutions and returns the one which is closest to startIndex in direction
 */
function findBestSolution(solutions, startIndex, direction) {
  let minDistance = Infinity;
  let chosenIndex;

  for (let i = 0; i < solutions.length; i++) {
    const distance = directionDistance(startIndex, solutions[i], direction);
    if (distance < minDistance) {
      minDistance = distance;
      chosenIndex = i;
    }
  }

  return solutions[chosenIndex];
}

/** Converts an adjoint matrix to row echelon form */
function toRowEchelonForm(adjointMatrix) {
  let row = 0n;
  let column = 0n;

  while (row < BigInt(adjointMatrix.length)) {
    // Find a row where the column bit is 1
    let rowIndex = undefined;
    let nonZero = false;
    for (let i = row; i < BigInt(adjointMatrix.length); i++) {
      if (adjointMatrix[i].row > 0n) {
        nonZero = true;
      }
      if (((adjointMatrix[i].row >> column) & 1n) === 1n) {
        rowIndex = i;
        break;
      }
    }
    if (rowIndex === undefined) {
      if (nonZero) {
        column += 1n;
        continue;
      }
      while (row < BigInt(adjointMatrix.length)) {
        adjointMatrix.pop();
      }
      return;
    }

    // Swap rowIndex with row
    const tempRow = adjointMatrix[row];
    adjointMatrix[row] = adjointMatrix[rowIndex];
    adjointMatrix[rowIndex] = tempRow;

    // Eliminate column from rows below
    for (let i = row + 1n; i < BigInt(adjointMatrix.length); i++) {
      if (((adjointMatrix[i].row >> column) & 1n) > 0n) {
        adjointMatrix[i].row ^= adjointMatrix[row].row;
        adjointMatrix[i].bit ^= adjointMatrix[row].bit;
      }
    }

    row += 1n;
    column += 1n;
  }
}

/**
 * Back substitutes a value into the adjoint matrix
 */
function backSubstitute(adjointMatrix, column, value) {
  const solutionBitMask = 1n << column;
  for (let i = 0; i < adjointMatrix.length; i++) {
    if ((adjointMatrix[i].row & solutionBitMask) > 0) {
      adjointMatrix[i].row %= solutionBitMask;
      adjointMatrix[i].bit ^= value;
    }
  }
}


/**
 * Finds the index for the next uuid which matches the known bits supplied in the specified direction.
 *
 * @param adjointMatrix Matrix rows corresponding paired with known bits of the UUID.
 *                      Matrix must be in row echelon form without trailing zero rows.
 * @param startIndex The index of the point to start searching from.
 * @param currentBitIndex The index of the current bit to be computed.
 * @param direction The direction to search in: 1 or -1.
 */
function nextIndexFromAdjoint(adjointMatrix, startIndex, currentBitIndex, direction) {
  // Find the solution from MSB to LSB
  let solution = 0n;
  for (let i = currentBitIndex; i >= 0n; i--) {
    const solutionBitMask = 1n << i;
    let bit;

    // If the last row of the matrix is a single bit in i, this determines a bit of the solution
    if (adjointMatrix.length > 0 && adjointMatrix[adjointMatrix.length - 1].row === solutionBitMask) {
      bit = adjointMatrix.pop().bit;
    }

    // Otherwise the bit is not determined, so we can pick intelligently or guess

    // We check if the solution has diverged from the startIndex,
    // if so then we want to pick the lowest/highest value (depending on the direction)
    // to minmise the difference between this solution and the startIndex.
    else if (maskIndex(startIndex, i) !== solution) {
      bit = direction === 1n ? 0n : 1n;
    }

    // Otherwise we have no idea what next bit is,
    // so we guess the next bit from the startIndex,
    // recurse into the solver, and check if we were correct
    else {
      bit = (startIndex >> i) & 1n;

      // Copy the adjoint matrix, since we may backtrack out of this
      const adjointMatrixCopy = adjointMatrix.map(({ row, bit }) => ({ row, bit }));
      backSubstitute(adjointMatrixCopy, i, bit);

      const potentialSolution = nextIndexFromAdjoint(adjointMatrixCopy, startIndex % solutionBitMask, i - 1n, direction);

      if (compareValues(potentialSolution, startIndex % solutionBitMask) === direction) {
        return potentialSolution | ((startIndex >> i) << i);
      }

      // Otherwise we guessed wrong
      bit ^= 1n
    }

    // Back substitute value into matrix and update the solution
    backSubstitute(adjointMatrix, i, bit);
    if (bit === 1n) solution |= solutionBitMask;
  }

  return solution;
}



/** Returns the adjoint matrix only for rows with known bits */
function getKnownAdjointMatrix(matrix, vector) {
  return matrix.map((row, i) => ({ row, bit: vector[i] })).filter(({ bit }) => bit !== undefined);
}

/**
 * Returns the index for the next UUID which matches
 * the pattern of bits supplied in the specified direction.
 * Offsets the index before and after solving to avoid the first UUID being 0
 */
function nextIndexForPattern(patternBits, startIndex, direction) {
  const adjointMatrix = getKnownAdjointMatrix(ENCRYPT_MATRIX, patternBits);
  toRowEchelonForm(adjointMatrix);

  return offsetIndex(
    nextIndexFromAdjoint(
      adjointMatrix,
      offsetIndex(startIndex, INDEX_OFFSET),
      UUID_ENTROPY - 1n,
      direction,
    ), -INDEX_OFFSET,
  );
}

/**
 * Finds the index for the next uuid which matches the query supplied in the specified direction.
 *   1. Iterates through each possible position for the query in the UUID string
 *   2. Solves each possibility
 *   3. Returns the solution closest to startIndex in direction
 */
export function findNextIndex(query, startIndex, direction) {
  query = query.toLowerCase();

  if (query.match(DISALLOWED_QUERY_CHARACTER)) return undefined;

  const padLength = indexToUUID(0n).length - query.length;
  const validPatterns = Array(padLength + 1).fill(0)
    .map((_, index) => '*'.repeat(index) + query + '*'.repeat(padLength - index))
    .map(insertHyphens)
    .filter(patternIsValid);

  if (validPatterns.length === 0) return undefined;

  if (query.length <= 2) {
    return nextIndexBruteForce(query, startIndex, direction);
  }

  return findBestSolution(validPatterns.map((pattern) => {
    return nextIndexForPattern(patternToBits(pattern), startIndex, direction);
  }), startIndex, direction);
}

/** Returns a UUID string from an index */
export function indexToUUID(index) {
  return uuidToString(encrypt(offsetIndex(index, INDEX_OFFSET), ENCRYPT_MATRIX));
}

/** Returns a UUID index from a string */
export function uuidToIndex(uuid) {
  return offsetIndex(encrypt(uuidValueFromString(uuid), INVERSE_ENCRYPT_MATRIX), -INDEX_OFFSET);
}

// for demonstration purposes only
export function intToUUID(n) {
  if (typeof n !== "bigint") {
    n = BigInt(n);
  }
  if (n < 0n) throw new Error("Number must be non-negative");
  if (n >= 1n << 122n) throw new Error("Number too large (max 122 bits)");

  // Layout the bits preserving the input value:
  // - 32 bits for time_low
  // - 16 bits for time_mid
  // - 12 bits for time_hi (version will be 4)
  // - 14 bits for clock_seq (variant will be 2)
  // - 48 bits for node

  const timeLow = n & 0xffff_ffffn;
  const timeMid = (n >> 32n) & 0xffffn;
  const timeHi = (n >> 48n) & 0x0fffn; // 12 bits
  const clockSeq = (n >> 60n) & 0x3fffn; // 14 bits
  const node = (n >> 74n) & 0xffff_ffffffffn;

  // Add version 4 and variant 2
  const timeHiAndVersion = timeHi | 0x4000n;
  const clockSeqAndReserved = clockSeq | 0x8000n;

  // Convert to hex strings with padding
  const p1 = timeLow.toString(16).padStart(8, "0");
  const p2 = timeMid.toString(16).padStart(4, "0");
  const p3 = timeHiAndVersion.toString(16).padStart(4, "0");
  const p4 = clockSeqAndReserved.toString(16).padStart(4, "0");
  const p5 = node.toString(16).padStart(12, "0");

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}
