/* Keep keyboard focus visible without leaving a focus ring after touch play. */
(() => {
  'use strict';
  const root = document.documentElement;
  const set = mode => { root.dataset.inputMode = mode; };
  set(matchMedia('(pointer: coarse)').matches ? 'pointer' : 'keyboard');
  addEventListener('pointerdown', () => set('pointer'), true);
  addEventListener('touchstart', () => set('pointer'), {capture: true, passive: true});
  addEventListener('keydown', event => {
    if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) set('keyboard');
  }, true);

  // Appended after page styles: programmatic dialog focus on iOS can match
  // :focus-visible even when the dialog was opened by a finger tap.
  addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
      html[data-input-mode="pointer"] :is(button,a,[role="button"]):focus-visible:not(.tile):not(.tube):not(.arrow) {
        outline: none !important;
      }
      html[data-input-mode="pointer"] .tile:focus-visible:not(.selected):not(.hinted),
      html[data-input-mode="pointer"] .tube:focus-visible:not(.sel) {
        outline: none !important;
      }
      html[data-input-mode="pointer"] .tile.selected:focus-visible {
        outline: 3px solid #b78c35 !important;
      }
      html[data-input-mode="pointer"] .arrow:focus-visible:not(.hinted) {
        color: #36584a !important;
      }
      html[data-input-mode="pointer"] .arrow:focus-visible:not(.hinted) .body {
        stroke-width: .16 !important;
      }
    `;
    document.head.append(style);
  }, {once: true});
})();
