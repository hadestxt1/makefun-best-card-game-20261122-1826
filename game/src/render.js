// Ember Court — the table, drawn as plain DOM: card backs for the
// warden's hand, face-up cards for yours, the two played cards in the
// middle, and life bars and scores that are always on screen. Every
// suit glyph is a small inline SVG drawn here, so the game needs no
// image files and no network request.
import { FOE_NAME, PLAYER_NAME, START_LIFE, suitById } from './config.js';
import { STATUS_LOSS, STATUS_PLAY, STATUS_TITLE, STATUS_WIN } from './world.js';

/** Hand-drawn suit marks, as 24x24 SVG paths. */
const GLYPHS = {
  flame: '<path d="M12 2c1 3.5-2.5 4.5-2.5 8a4.5 4.5 0 0 0 9 0c0-1.8-.9-2.8-1.8-3.8-.2 1-.9 1.8-1.9 1.8.9-1.8.4-4.2-2.8-6z" fill="currentColor"/><path d="M12 13.5c.8 1.2-.7 1.8-.7 3a2.2 2.2 0 0 0 4.4 0c0-1.5-1.4-2-1.4-3.2-.5.6-1.3.9-2.3.2z" fill="#fff" opacity=".55"/>',
  leaf: '<path d="M20 4C10 4 4 10 4 20c10 0 16-6 16-16z" fill="currentColor"/><path d="M6 18C9 13 13 9 18 6" stroke="#fff" stroke-width="1.6" fill="none" opacity=".6" stroke-linecap="round"/>',
  peak: '<path d="M12 3 3 21h18L12 3z" fill="currentColor"/><path d="M12 3 8.5 10l2.2 1.6L12 9.4l1.8 2.4 2-1.4L12 3z" fill="#fff" opacity=".55"/>',
  wave: '<path d="M2 9c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2.4 5-1v3.5c-1.5-1.4-2.5-2-5 1s-5 3-7.5 0-5-3-7.5 0V9z" fill="currentColor"/><path d="M2 16c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2.4 5-1v3.5c-1.5-1.4-2.5-2-5 1s-5 3-7.5 0-5-3-7.5 0V16z" fill="currentColor" opacity=".65"/>',
};

function glyph(suitId) {
  const suit = suitById(suitId);
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${GLYPHS[suit.glyph]}</svg>`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

function lifeBar(life, label) {
  const pct = Math.max(0, Math.min(100, (life / START_LIFE) * 100));
  const tone = life > 10 ? 'good' : life > 5 ? 'warn' : 'low';
  return `<div class="life" role="meter" aria-label="${escapeHtml(label)} life ${life} of ${START_LIFE}">
    <div class="life-fill ${tone}" style="width:${pct}%"></div>
    <span class="life-text">♥ ${life} / ${START_LIFE}</span></div>`;
}

function cardFace(card, { back = false, small = false } = {}) {
  if (back) {
    return `<div class="card back${small ? ' small' : ''}" aria-hidden="true">
      <div class="card-back-mark">♛</div><div class="card-back-word">EMBER<br>COURT</div></div>`;
  }
  const suit = suitById(card.suit);
  const crown = card.value === 7 ? ' crown' : '';
  return `<div class="card${crown}${small ? ' small' : ''}" style="--suit:${suit.color};--suit-light:${suit.light}">
    <div class="card-corner top"><span class="card-value">${card.value}</span><span class="card-glyph">${glyph(card.suit)}</span></div>
    <div class="card-center"><span class="card-glyph big">${glyph(card.suit)}</span></div>
    <div class="card-name">${escapeHtml(card.rank)}<br><span>${escapeHtml(suit.name)}</span></div>
    <div class="card-corner bottom"><span class="card-value">${card.value}</span><span class="card-glyph">${glyph(card.suit)}</span></div>
  </div>`;
}

function playedSlot(card, who) {
  if (!card) return `<div class="played empty"><span>${who} has not played yet</span></div>`;
  return `<div class="played">${cardFace(card)}<div class="played-who">${escapeHtml(who)}</div></div>`;
}

export function createRenderer(root) {
  function draw(state) {
    const screen = state.status;
    let html = '';

    if (screen === STATUS_TITLE) {
      const preview = [
        { suit: 'ember', value: 7, rank: 'Crown', name: 'Ember Crown' },
        { suit: 'tide', value: 6, rank: 'Lord', name: 'Tide Lord' },
        { suit: 'gale', value: 5, rank: 'Champion', name: 'Gale Champion' },
        { suit: 'stone', value: 4, rank: 'Knight', name: 'Stone Knight' },
      ];
      html = `<section class="title-screen">
        <p class="title-kicker">A duel of the four court suits</p>
        <h1>EMBER COURT</h1>
        <p class="title-sub">Outplay Marlowe, Warden of the Tide, card by card — until one of you falls.</p>
        <div class="title-cards">${preview.map((card) => cardFace(card)).join('')}</div>
        <div class="title-rules">
          <p><strong>How a round works:</strong> you and Marlowe each lay one card. A card's power is its value, <strong>+2</strong> when its suit has the advantage — <span class="suit ember">Ember</span> burns <span class="suit gale">Gale</span>, <span class="suit gale">Gale</span> wears down <span class="suit stone">Stone</span>, <span class="suit stone">Stone</span> dams <span class="suit tide">Tide</span>, <span class="suit tide">Tide</span> drowns <span class="suit ember">Ember</span>.</p>
          <p>The higher power wins the round and the loser takes the difference in damage. A tie is a clash: both take 1. Winning with a <strong>Crown (7)</strong> restores 2 of your life. First to 0 life loses.</p>
        </div>
        <p class="title-start">Press <kbd>Space</kbd> or click anywhere to begin</p>
        <p class="title-keys">Play a card: click it, or press <kbd>1</kbd>–<kbd>5</kbd> &nbsp;·&nbsp; Restart: <kbd>R</kbd></p>
      </section>`;
    } else {
      const foeCards = state.foeHand.map(() => cardFace(null, { back: true, small: true })).join('');
      const playerCards = state.playerHand.map((card, index) => {
        const played = state.playerPlayed && state.playerPlayed.id === card.id;
        return `<button class="hand-card${played ? ' just-played' : ''}" data-index="${index}" aria-label="Play ${escapeHtml(card.name)}, value ${card.value}">${cardFace(card)}</button>`;
      }).join('');
      const resultLine = state.lastResult
        ? `<p class="round-result ${state.lastResult}">${escapeHtml(state.lastMessage)}</p>`
        : `<p class="round-result">Round ${state.round} — play a card.</p>`;
      const scoreLine = `Rounds won ${state.roundsWon} · lost ${state.roundsLost} · damage dealt ${state.damageDealt} · taken ${state.damageTaken}`;

      html = `<section class="table">
        <header class="foe-row">
          <div class="side-info"><h2>${escapeHtml(FOE_NAME)}</h2>${lifeBar(state.foeLife, 'Marlowe')}</div>
          <div class="foe-hand" aria-label="Marlowe's hand, ${state.foeHand.length} cards face down">${foeCards}</div>
          <div class="round-badge">ROUND<br><span>${state.round}</span></div>
        </header>
        <div class="middle-row">
          ${playedSlot(state.foePlayed, 'Marlowe')}
          <div class="versus"><span>VS</span>${resultLine}</div>
          ${playedSlot(state.playerPlayed, 'You')}
        </div>
        <footer class="player-row">
          <div class="side-info"><h2>${escapeHtml(PLAYER_NAME)}</h2>${lifeBar(state.playerLife, 'Your')}</div>
          <div class="player-hand" aria-label="Your hand">${playerCards}</div>
          <div class="score-box">${escapeHtml(scoreLine)}</div>
        </footer>
      </section>`;

      if (screen === STATUS_WIN || screen === STATUS_LOSS) {
        const won = screen === STATUS_WIN;
        html += `<section class="end-screen ${won ? 'win' : 'loss'}" role="dialog" aria-label="${won ? 'Victory' : 'Defeat'}">
          <h1>${won ? 'VICTORY' : 'DEFEAT'}</h1>
          <p class="end-sub">${won
            ? 'The court is yours. Marlowe bows, and the Ember Crown is yours to keep.'
            : 'Marlowe keeps the court. The Tide Warden dealt the final blow — challenge again.'}</p>
          <p class="end-score">Final life — You ${state.playerLife} · Marlowe ${state.foeLife}</p>
          <p class="end-score">${escapeHtml(scoreLine)} · ${state.round} rounds played</p>
          <p class="end-restart">Press <kbd>R</kbd> or click to play again</p>
        </section>`;
      }
    }

    root.innerHTML = html;
    return root;
  }

  return { draw };
}
