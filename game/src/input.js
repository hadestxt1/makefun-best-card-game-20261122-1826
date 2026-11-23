// Ember Court — keyboard and mouse, nothing else. Clicking a card in
// your hand plays it at once; keys 1-5 play the card in that seat.
// Space or Enter starts from the title screen, R restarts after a
// duel ends, and a click anywhere starts or restarts too.
export const ACTION_START = 1;
export const ACTION_RESTART = 2;

export function createInput(root, hooks) {
  function playIndex(index) {
    hooks.onPlay(index);
  }

  function onClick(event) {
    const button = event.target.closest('[data-index]');
    if (button) {
      playIndex(Number(button.dataset.index));
      return;
    }
    hooks.onTap();
  }

  function onKey(event) {
    if (event.repeat) return;
    const key = event.key;
    if (key >= '1' && key <= '5') {
      playIndex(Number(key) - 1);
      return;
    }
    if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      hooks.onTap();
      return;
    }
    if (key === 'r' || key === 'R') hooks.onRestart();
  }

  root.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  return {
    detach() {
      root.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
    },
  };
}
