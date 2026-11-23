// Ember Court — the staged scenes behind ?shot=title|play|win|loss.
// Each one plays the real rules forward from a fresh duel with a
// fixed seed and a fixed policy, so the frame is what a real duel
// looks like and the same seed always gives the same frame. Nothing
// here is drawn by hand: the screenshots are renders of the game
// itself.
//
//   title — the court before the first card is played.
//   play  — four rounds in, both sides bloodied, cards on the table.
//   win   — the challenger plays the strongest card every round until
//           Marlowe falls.
//   loss  — the challenger plays the weakest card every round until
//           they fall.
import { STATUS_LOSS, STATUS_PLAY, STATUS_TITLE, STATUS_WIN } from './world.js';

const PLAY_ROUNDS = 4;
const MAX_ROUNDS = 60;

/** Index of the strongest card in a hand. */
function strongestIndex(hand) {
  let best = 0;
  for (let index = 1; index < hand.length; index += 1) {
    if (hand[index].value > hand[best].value) best = index;
  }
  return best;
}

/** Index of the weakest card in a hand. */
function weakestIndex(hand) {
  let worst = 0;
  for (let index = 1; index < hand.length; index += 1) {
    if (hand[index].value < hand[worst].value) worst = index;
  }
  return worst;
}

/** Index of the card nearest the middle of the hand, by value. */
function middleIndex(hand) {
  const sorted = hand.map((card, index) => ({ value: card.value, index }));
  sorted.sort((a, b) => a.value - b.value);
  return sorted[Math.floor(sorted.length / 2)].index;
}

/**
 * Set `world` to the named scene and return the screen to draw.
 * The world is always started first; the title scene then shows the
 * court with the opening hands dealt but no round played.
 */
export function stageShot(name, world) {
  const { state } = world;
  world.start();
  if (name === 'title' || (name !== 'play' && name !== 'win' && name !== 'loss')) {
    state.status = STATUS_TITLE;
    state.playerPlayed = null;
    state.foePlayed = null;
    state.lastResult = null;
    state.lastMessage = 'The court is seated. Play a card to open the duel.';
    return STATUS_TITLE;
  }

  let pick;
  let limit = MAX_ROUNDS;
  if (name === 'play') {
    pick = middleIndex;
    limit = PLAY_ROUNDS;
  } else if (name === 'win') {
    pick = strongestIndex;
  } else {
    pick = weakestIndex;
  }

  let played = 0;
  while (played < limit && state.status === STATUS_PLAY) {
    if (!world.playRound(pick(state.playerHand))) break;
    played += 1;
  }

  if (name === 'play') {
    // A mid-duel frame: still in play, cards from the last round on
    // the table, both life totals dented.
    return state.status === STATUS_PLAY ? STATUS_PLAY : state.status;
  }
  if (name === 'win') return state.status === STATUS_WIN ? STATUS_WIN : STATUS_LOSS;
  return state.status === STATUS_LOSS ? STATUS_LOSS : STATUS_WIN;
}
