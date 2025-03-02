/**
 * String comparison utilities for advanced text matching
 * Provides type-safe implementations of various string similarity algorithms
 */

/**
 * Options for string similarity calculations
 */
export interface StringSimilarityOptions {
  /** Whether to normalize strings before comparison (lowercase, trim, etc.) */
  normalize?: boolean;
  /** Whether to remove parenthetical content like (feat. Artist) */
  removeParentheses?: boolean;
  /** Whether to remove brackets like [Official Video] */
  removeBrackets?: boolean;
  /** Whether to remove special characters */
  removeSpecialChars?: boolean;
}

/**
 * Token comparison methods available
 */
export type TokenComparisonMethod =
  | "exact"
  | "contains"
  | "jaroWinkler"
  | "tokenSet"
  | "containment";

/**
 * Metrics from string comparison operations
 */
export interface StringSimilarityMetrics {
  jaroWinkler: number;
  tokenSet: number;
  containment: number;
  exactMatch: boolean;
}

/**
 * Result of a string comparison
 */
export interface StringComparisonResult {
  /** Overall similarity score (0-1) */
  similarity: number;
  /** Detailed metrics from various algorithms */
  metrics: StringSimilarityMetrics;
}

/**
 * Normalizes a string for comparison based on provided options
 *
 * @param str - Input string to normalize
 * @param options - Normalization options
 * @returns Normalized string
 */
export function normalizeString(
  str: string,
  options: StringSimilarityOptions = {}
): string {
  if (!str) return "";

  const {
    normalize = true,
    removeParentheses = true,
    removeBrackets = true,
    removeSpecialChars = true,
  } = options;

  let result = str;

  if (normalize) {
    result = result.toLowerCase().trim();
  }

  if (removeParentheses) {
    result = result.replace(/\(feat\.?.*?\)/gi, ""); // Remove "feat." parts
    result = result.replace(/\(.*?\)/g, ""); // Remove other parentheses
  }

  if (removeBrackets) {
    result = result.replace(/\[.*?\]/g, ""); // Remove brackets
  }

  if (removeSpecialChars) {
    result = result.replace(/[^\w\s]/g, ""); // Remove non-alphanumeric chars
  }

  // Replace multiple spaces with single space and trim
  return result.replace(/\s+/g, " ").trim();
}

/**
 * Calculates Jaro-Winkler similarity between two strings
 * Returns a value between 0 (no similarity) and 1 (identical)
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Similarity score between 0 and 1
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (!s1 && !s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // Calculate Jaro similarity
  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;

  // Find matching characters
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matchingChars = 0;
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matchingChars++;
        break;
      }
    }
  }

  if (matchingChars === 0) return 0;

  // Count transpositions
  let transpositions = 0;
  let k = 0;

  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;

      if (s1[i] !== s2[k]) {
        transpositions++;
      }
      k++;
    }
  }

  // Calculate Jaro similarity
  const jaroSim =
    (matchingChars / s1.length +
      matchingChars / s2.length +
      (matchingChars - transpositions / 2) / matchingChars) /
    3;

  // Calculate Jaro-Winkler similarity with prefix scaling
  let prefixLength = 0;
  const maxPrefixLength = 4;
  while (
    prefixLength < maxPrefixLength &&
    prefixLength < s1.length &&
    prefixLength < s2.length &&
    s1[prefixLength] === s2[prefixLength]
  ) {
    prefixLength++;
  }

  // Winkler's scaling factor
  const p = 0.1;
  return jaroSim + prefixLength * p * (1 - jaroSim);
}

/**
 * Finds the longest common substring between two strings
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns The longest common substring
 */
export function longestCommonSubstring(s1: string, s2: string): string {
  if (!s1 || !s2) return "";

  let longest = "";
  const matrix: number[][] = Array(s1.length + 1)
    .fill(undefined)
    .map(() => Array(s2.length + 1).fill(0));

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;

        if (matrix[i][j] > longest.length) {
          longest = s1.substring(i - matrix[i][j], i);
        }
      }
    }
  }

  return longest;
}

/**
 * Calculates containment score between two strings
 * Measures how much one string is contained within another
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Containment score between 0 and 1
 */
export function calculateContainment(s1: string, s2: string): number {
  if (!s1 && !s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // Check if either string fully contains the other
  if (s1.includes(s2)) return 0.9; // Not quite 1.0 to prefer exact matches
  if (s2.includes(s1)) return 0.9;

  // Calculate partial containment based on longest common substring
  const lcs = longestCommonSubstring(s1, s2);
  const containmentRatio = lcs.length / Math.min(s1.length, s2.length);
  return containmentRatio;
}

/**
 * Calculates token set similarity between two strings
 * Compares sets of words regardless of their order
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Similarity score between 0 and 1
 */
export function tokenSetSimilarity(s1: string, s2: string): number {
  if (!s1 && !s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // Tokenize strings
  const tokens1 = new Set(s1.split(/\s+/));
  const tokens2 = new Set(s2.split(/\s+/));

  // Calculate intersection and union
  const intersection = new Set(
    [...tokens1].filter((token) => tokens2.has(token))
  );
  const union = new Set([...tokens1, ...tokens2]);

  // Calculate Jaccard similarity
  return intersection.size / union.size;
}

/**
 * Compares two strings using multiple comparison methods
 * Returns a detailed comparison result with metrics from each method
 *
 * @param s1 - First string to compare
 * @param s2 - Second string to compare
 * @param options - String comparison options
 * @returns Detailed comparison result with metrics
 */
export function compareStrings(
  s1: string,
  s2: string,
  options: StringSimilarityOptions = {}
): StringComparisonResult {
  // Normalize strings according to options
  const s1Norm = normalizeString(s1, options);
  const s2Norm = normalizeString(s2, options);

  // Check for exact match
  const exactMatch = s1Norm === s2Norm;

  // Calculate different similarity metrics
  const jaroScore = jaroWinklerSimilarity(s1Norm, s2Norm);
  const tokenScore = tokenSetSimilarity(s1Norm, s2Norm);
  const containmentScore = calculateContainment(s1Norm, s2Norm);

  // Calculate overall similarity with balanced weighting
  const similarity = exactMatch
    ? 1.0
    : jaroScore * 0.5 + tokenScore * 0.3 + containmentScore * 0.2;

  return {
    similarity,
    metrics: {
      jaroWinkler: jaroScore,
      tokenSet: tokenScore,
      containment: containmentScore,
      exactMatch,
    },
  };
}

/**
 * Options for the weighted string comparison
 */
export interface WeightedComparisonOptions extends StringSimilarityOptions {
  /** Weight for Jaro-Winkler similarity (0-1) */
  jaroWinklerWeight?: number;
  /** Weight for token set similarity (0-1) */
  tokenSetWeight?: number;
  /** Weight for containment similarity (0-1) */
  containmentWeight?: number;
  /** Bonus score added for exact matches (0-1) */
  exactMatchBonus?: number;
}

/**
 * Performs a weighted comparison between two strings
 * Allows customizing the influence of each comparison method
 *
 * @param s1 - First string to compare
 * @param s2 - Second string to compare
 * @param options - Weighting and normalization options
 * @returns Weighted similarity score between 0 and 1
 */
export function weightedStringComparison(
  s1: string,
  s2: string,
  options: WeightedComparisonOptions = {}
): number {
  const {
    jaroWinklerWeight = 0.5,
    tokenSetWeight = 0.3,
    containmentWeight = 0.2,
    exactMatchBonus = 0.1,
    ...normalizationOptions
  } = options;

  // Verify weights sum to 1.0
  const totalWeight = jaroWinklerWeight + tokenSetWeight + containmentWeight;
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    console.warn(
      `Warning: Weights do not sum to 1.0 (${totalWeight}). Results may be unexpected.`
    );
  }

  // Get comparison result with metrics
  const result = compareStrings(s1, s2, normalizationOptions);

  // Apply custom weighting
  let score =
    result.metrics.jaroWinkler * jaroWinklerWeight +
    result.metrics.tokenSet * tokenSetWeight +
    result.metrics.containment * containmentWeight;

  // Add bonus for exact match
  if (result.metrics.exactMatch) {
    score = Math.min(1.0, score + exactMatchBonus);
  }

  return score;
}
