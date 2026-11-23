// Ember Court — a small seeded random source, so a whole game can be
// replayed from one number: the same seed always shuffles the same
// deck and steers the opponent the same way. Nothing here reads the
// clock, so a staged screenshot is the same frame every time.
export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return {
    /** A float in [0, 1). */
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    /** An integer in [0, bound). */
    int(bound) {
      return Math.floor(this.next() * bound);
    },
  };
}

/** Shuffle `items` in place with the seeded source, Fisher-Yates. */
export function shuffle(items, random) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = random.int(index + 1);
    const held = items[index];
    items[index] = items[other];
    items[other] = held;
  }
  return items;
}
