// Ember Court — boot and the one loop. The game moves between four
// screens: title, play, win and loss. The world only changes when a
// card is played, so the page repaints after each action instead of
// running a frame loop.
//
// ?seed=N fixes the shuffle and the warden's picks. ?shot=title|play|
// win|loss (with &seed=N) stages that scene instead of starting the
// loop, paints it twice and sets window.__shotReady for a screenshot.
import { createRandom } from './random.js';
import { createWorld, STATUS_LOSS, STATUS_PLAY, STATUS_TITLE, STATUS_WIN } from './world.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 20261123;

const root = document.getElementById('table');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(root);

// A handle the play-test drives: the live state, and a way to start
// a duel and play a card without a pointer.
window.__ember = { world, state: world.state };

function announce(message) {
  status.textContent = message;
}

function repaint() {
  renderer.draw(world.state);
  announce(world.state.lastMessage || 'Ember Court.');
}

function runShot(name) {
  const screen = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state);
    announce(world.state.lastMessage || 'Ember Court.');
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
  return screen;
}

function runGame() {
  createInput(document.body, {
    onPlay(index) {
      const state = world.state;
      if (state.status === STATUS_TITLE) {
        world.start();
        repaint();
        return;
      }
      if (state.status !== STATUS_PLAY) return;
      if (world.playRound(index)) repaint();
    },
    onTap() {
      const state = world.state;
      if (state.status === STATUS_TITLE) {
        world.start();
        repaint();
      } else if (state.status === STATUS_WIN || state.status === STATUS_LOSS) {
        world.start();
        repaint();
      }
    },
    onRestart() {
      const state = world.state;
      if (state.status !== STATUS_TITLE) {
        world.start();
        repaint();
      }
    },
  });

  announce('Ember Court. Press Space or click to start.');
  renderer.draw(world.state);
}

if (shot) runShot(shot);
else runGame();
