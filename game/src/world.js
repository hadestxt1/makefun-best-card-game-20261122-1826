// Ember Court — the duel's rules and state, with no drawing and no
// browser in it, so the same code can be driven by the page, by a
// staged screenshot, or by a plain Node test.
//
// A duel: both sides hold 5 cards from a 24-card court deck (four
// suits, values 2-7). Each round both play one card face up. A card's
// power is its value, +2 when its suit has the advantage over the
// other card's suit. The higher power wins the round and the loser
// takes damage equal to the gap (at least 1). A tied round is a clash:
// both sides take 1. Winning a round with a Crown (a 7) restores 2
// life to the winner. Hands refill to 5 after every round; when the
// deck runs dry the discard pile is shuffled back in. The first side
// at 0 life loses.
import {
  ADVANTAGE_BONUS,
  CLASH_DAMAGE,
  CROWN_HEAL,
  HAND_SIZE,
  RANK_NAMES,
  START_LIFE,
  SUITS,
  VALUES,
  suitById,
} from './config.js';
import { shuffle } from './random.js';

export const STATUS_TITLE = 'title';
export const STATUS_PLAY = 'play';
export const STATUS_WIN = 'win';
export const STATUS_LOSS = 'loss';

export const RESULT_WIN = 'win';
export const RESULT_LOSS = 'loss';
export const RESULT_CLASH = 'clash';

let nextCardId = 1;

/** One court card: a suit, a value, and the rank name that goes with it. */
export function makeCard(suitId, value) {
  return {
    id: nextCardId,
    suit: suitId,
    value,
    rank: RANK_NAMES[value],
    name: `${suitById(suitId).name} ${RANK_NAMES[value]}`,
  };
}

export function buildDeck() {
  nextCardId = 1;
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) deck.push(makeCard(suit.id, value));
  }
  return deck;
}

/** A card's power against one opposing card. */
export function cardPower(card, opposing) {
  if (!card || !opposing) return card ? card.value : 0;
  return card.value + (suitById(card.suit).beats === opposing.suit ? ADVANTAGE_BONUS : 0);
}

export function createWorld(random) {
  const state = {
    random,
    status: STATUS_TITLE,
    deck: [],
    discard: [],
    playerHand: [],
    foeHand: [],
    playerLife: START_LIFE,
    foeLife: START_LIFE,
    round: 0,
    playerPlayed: null,
    foePlayed: null,
    lastResult: null,
    lastDamage: 0,
    lastMessage: '',
    roundsWon: 0,
    roundsLost: 0,
    damageDealt: 0,
    damageTaken: 0,
  };

  function drawInto(hand) {
    while (hand.length < HAND_SIZE) {
      if (state.deck.length === 0) {
        if (state.discard.length === 0) return;
        state.deck = shuffle(state.discard.splice(0), state.random);
      }
      hand.push(state.deck.pop());
    }
  }

  function start() {
    state.deck = shuffle(buildDeck(), state.random);
    state.discard = [];
    state.playerHand = [];
    state.foeHand = [];
    state.playerLife = START_LIFE;
    state.foeLife = START_LIFE;
    state.round = 1;
    state.playerPlayed = null;
    state.foePlayed = null;
    state.lastResult = null;
    state.lastDamage = 0;
    state.lastMessage = 'The court is seated. Play a card to open the duel.';
    state.roundsWon = 0;
    state.roundsLost = 0;
    state.damageDealt = 0;
    state.damageTaken = 0;
    state.status = STATUS_PLAY;
    drawInto(state.playerHand);
    drawInto(state.foeHand);
  }

  /** The warden's pick: usually its weakest card, sometimes a wild one. */
  function foeChoose() {
    const hand = state.foeHand;
    if (hand.length === 0) return -1;
    if (state.random.next() < 0.6) {
      let weakest = 0;
      for (let index = 1; index < hand.length; index += 1) {
        if (hand[index].value < hand[weakest].value) weakest = index;
      }
      return weakest;
    }
    return state.random.int(hand.length);
  }

  /**
   * Play one round: the player lays the card at `playerIndex`, the
   * warden answers, damage is dealt, hands refill, and the duel may
   * end. Returns false when no round could be played.
   */
  function playRound(playerIndex) {
    if (state.status !== STATUS_PLAY) return false;
    if (playerIndex < 0 || playerIndex >= state.playerHand.length) return false;
    const foeIndex = foeChoose();
    if (foeIndex < 0) return false;

    const playerCard = state.playerHand.splice(playerIndex, 1)[0];
    const foeCard = state.foeHand.splice(foeIndex, 1)[0];
    state.playerPlayed = playerCard;
    state.foePlayed = foeCard;

    const playerPower = cardPower(playerCard, foeCard);
    const foePower = cardPower(foeCard, playerCard);

    if (playerPower > foePower) {
      const damage = Math.max(1, playerPower - foePower);
      state.foeLife = Math.max(0, state.foeLife - damage);
      state.damageDealt += damage;
      state.roundsWon += 1;
      state.lastResult = RESULT_WIN;
      state.lastDamage = damage;
      let message = `Your ${playerCard.name} (${playerPower}) beats ${foeCard.name} (${foePower}) — Marlowe takes ${damage} damage.`;
      if (playerCard.value === 7 && state.playerLife < START_LIFE) {
        state.playerLife = Math.min(START_LIFE, state.playerLife + CROWN_HEAL);
        message += ` The Crown restores ${CROWN_HEAL} of your life.`;
      }
      state.lastMessage = message;
    } else if (foePower > playerPower) {
      const damage = Math.max(1, foePower - playerPower);
      state.playerLife = Math.max(0, state.playerLife - damage);
      state.damageTaken += damage;
      state.roundsLost += 1;
      state.lastResult = RESULT_LOSS;
      state.lastDamage = damage;
      let message = `Marlowe's ${foeCard.name} (${foePower}) beats your ${playerCard.name} (${playerPower}) — you take ${damage} damage.`;
      if (foeCard.value === 7 && state.foeLife < START_LIFE) {
        state.foeLife = Math.min(START_LIFE, state.foeLife + CROWN_HEAL);
        message += ` The Crown restores ${CROWN_HEAL} of Marlowe's life.`;
      }
      state.lastMessage = message;
    } else {
      state.playerLife = Math.max(0, state.playerLife - CLASH_DAMAGE);
      state.foeLife = Math.max(0, state.foeLife - CLASH_DAMAGE);
      state.damageTaken += CLASH_DAMAGE;
      state.damageDealt += CLASH_DAMAGE;
      state.lastResult = RESULT_CLASH;
      state.lastDamage = CLASH_DAMAGE;
      state.lastMessage = `Clash! Both ${playerCard.name} and ${foeCard.name} stand at ${playerPower} — each side takes ${CLASH_DAMAGE} damage.`;
    }

    state.discard.push(playerCard, foeCard);
    if (state.playerLife <= 0 && state.foeLife <= 0) {
      // A double fall goes to the side that dealt more damage overall.
      state.status = state.damageDealt >= state.damageTaken ? STATUS_WIN : STATUS_LOSS;
    } else if (state.foeLife <= 0) {
      state.status = STATUS_WIN;
    } else if (state.playerLife <= 0) {
      state.status = STATUS_LOSS;
    } else {
      state.round += 1;
      drawInto(state.playerHand);
      drawInto(state.foeHand);
    }
    return true;
  }

  return { state, start, playRound, foeChoose, drawInto };
}
