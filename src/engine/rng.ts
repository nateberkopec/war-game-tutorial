/**
 * Seeded random number generator for reproducible games and replays.
 * Uses a mulberry32 PRNG algorithm for simplicity and good distribution.
 */

export interface RngState {
  seed: number
  calls: number
}

export interface Rng {
  /** Get next random number in [0, 1) */
  next(): number
  /** Get next random integer in [0, max) */
  nextInt(max: number): number
  /** Get current state for serialization */
  getState(): RngState
  /** Restore from serialized state */
  setState(state: RngState): void
  /** Get the original seed string */
  getSeed(): string
}

/**
 * Simple hash function to convert a string seed to a number.
 * Uses djb2 algorithm.
 */
function hashSeed(seed: string): number {
  let hash = 5381
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i)
  }
  return hash >>> 0 // Ensure unsigned 32-bit integer
}

/**
 * Mulberry32 PRNG - fast, simple, good distribution.
 * Takes a 32-bit seed and returns a value in [0, 1).
 */
function mulberry32(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/**
 * Create a seeded random number generator.
 * If no seed is provided, uses current timestamp.
 */
export function createRng(seed?: string): Rng {
  const seedString = seed ?? Date.now().toString()
  let state: RngState = {
    seed: hashSeed(seedString),
    calls: 0,
  }

  function next(): number {
    state.calls++
    // Advance the seed for each call
    state.seed = (state.seed + state.calls) >>> 0
    return mulberry32(state.seed)
  }

  function nextInt(max: number): number {
    return Math.floor(next() * max)
  }

  function getState(): RngState {
    return { ...state }
  }

  function setState(newState: RngState): void {
    state = { ...newState }
  }

  function getSeed(): string {
    return seedString
  }

  return {
    next,
    nextInt,
    getState,
    setState,
    getSeed,
  }
}

/**
 * Serialize RNG state to a string for storage.
 */
export function serializeRngState(state: RngState): string {
  return JSON.stringify(state)
}

/**
 * Deserialize RNG state from a string.
 */
export function deserializeRngState(serialized: string): RngState {
  return JSON.parse(serialized) as RngState
}
