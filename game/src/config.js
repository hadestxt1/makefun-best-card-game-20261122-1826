// Ember Court — every tuning number and colour in one place.
// The table is a fixed 1280x800 logical area; the renderer lays the
// opponent's row, the played-card row and the player's row out in it,
// so no rule below depends on the window size.
export const WIDTH = 1280;
export const HEIGHT = 800;

/** Life each duellist starts with. */
export const START_LIFE = 20;
/** Cards held at the start of every round. */
export const HAND_SIZE = 5;
/** Card values in the deck; 7 is the Crown, the strongest rank. */
export const VALUES = [2, 3, 4, 5, 6, 7];
/** Bonus power for playing a suit that has the advantage. */
export const ADVANTAGE_BONUS = 2;
/** Life a Crown win restores to its winner. */
export const CROWN_HEAL = 2;
/** Damage both sides take when a round ends in a tie. */
export const CLASH_DAMAGE = 1;

/** Rank names, by value. */
export const RANK_NAMES = {
  2: 'Squire',
  3: 'Scout',
  4: 'Knight',
  5: 'Champion',
  6: 'Lord',
  7: 'Crown',
};

/**
 * The four court suits. Each suit has the advantage over exactly one
 * other: Ember burns Gale, Gale wears down Stone, Stone dams Tide,
 * and Tide drowns Ember.
 */
export const SUITS = [
  { id: 'ember', name: 'Ember', beats: 'gale', color: '#d84a2f', light: '#f7c9a8', glyph: 'flame' },
  { id: 'gale', name: 'Gale', beats: 'stone', color: '#3f9e4d', light: '#c8e8c0', glyph: 'leaf' },
  { id: 'stone', name: 'Stone', beats: 'tide', color: '#8a7d6b', light: '#ddd3c2', glyph: 'peak' },
  { id: 'tide', name: 'Tide', beats: 'ember', color: '#3d7bd9', light: '#c2d8f7', glyph: 'wave' },
];

export function suitById(id) {
  return SUITS.find((suit) => suit.id === id);
}

/** The name of the court's current champion, your opponent. */
export const FOE_NAME = 'Marlowe, Warden of the Tide';
export const PLAYER_NAME = 'You, Challenger of the Court';
