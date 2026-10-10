export const KEYS = {
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', Space: 'jump',
  KeyJ: 'light', KeyK: 'heavy', KeyL: 'kick', ShiftLeft: 'block', ShiftRight: 'block',
  KeyQ: 'dodge', KeyE: 'grab', KeyR: 'special', KeyF: 'use', KeyG: 'drop',
  Escape: 'pause', Enter: 'confirm', Backspace: 'back',
};
export const PAD = { 0: 'jump', 1: 'dodge', 2: 'light', 3: 'heavy', 4: 'block', 5: 'kick', 6: 'grab', 7: 'special', 8: 'use', 9: 'pause', 10: 'drop', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };

export class Input {
  constructor(canvas) {
    this.sources = new Map();
    this.held = new Set();
    this.pressed = new Set();
    this.buffer = new Map();
    this.time = 0;
    this.padCount = 0;
    this.device = 'keyboard';
    this.touchEnabled = matchMedia('(pointer: coarse)').matches;
    this.menu = true;
    this.onPause = () => {};
    this.onDisconnect = () => {};
    this.onDevice = () => {};
    window.addEventListener('keydown', event => {
      if (event.ctrlKey || event.metaKey || event.altKey || !KEYS[event.code]) return;
      if (['INPUT', 'SELECT'].includes(event.target.tagName)) return;
      event.preventDefault();
      this.set(`key:${event.code}`, KEYS[event.code], true, 'keyboard');
    });
    window.addEventListener('keyup', event => this.set(`key:${event.code}`, KEYS[event.code], false));
    window.addEventListener('blur', () => { this.clear(); this.onPause(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { this.clear(); this.onPause(); } });
    canvas.addEventListener('contextmenu', event => event.preventDefault());
    canvas.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || this.menu) return;
      this.set(`mouse:${event.button}`, ['light', 'kick', 'heavy'][event.button], true, 'keyboard');
    });
    window.addEventListener('pointerup', event => this.set(`mouse:${event.button}`, ['light', 'kick', 'heavy'][event.button], false));
    window.addEventListener('gamepaddisconnected', () => { this.clear(); this.onDisconnect(); });
    this.createTouch();
  }
  set(source, action, down, device) {
    if (!action) return;
    if (down) this.sources.set(source, action); else this.sources.delete(source);
    const active = [...this.sources.values()].includes(action);
    if (active && !this.held.has(action)) { this.pressed.add(action); this.buffer.set(action, this.time + 0.15); }
    if (active) this.held.add(action); else this.held.delete(action);
    if (down && device && device !== this.device) { this.device = device; this.onDevice(device); }
  }
  poll(dt) {
    this.time += dt;
    const pads = [...(navigator.getGamepads?.() || [])].filter(p => p?.connected);
    this.padCount = pads.length;
    const pad = pads[0];
    for (const [button, action] of Object.entries(PAD)) this.set(`pad:${button}`, action, !!pad?.buttons[button]?.pressed, 'gamepad');
    this.set('axis:left', 'left', (pad?.axes[0] || 0) < -0.3, 'gamepad');
    this.set('axis:right', 'right', (pad?.axes[0] || 0) > 0.3, 'gamepad');
    this.set('axis:up', 'up', (pad?.axes[1] || 0) < -0.5, 'gamepad');
    this.set('axis:down', 'down', (pad?.axes[1] || 0) > 0.5, 'gamepad');
  }
  is(action) { return this.held.has(action); }
  hit(action) { return this.pressed.has(action); }
  consume(action) {
    if ((this.buffer.get(action) || 0) <= this.time) return false;
    this.buffer.delete(action);
    return true;
  }
  end() { this.pressed.clear(); }
  flush() { this.pressed.clear(); this.buffer.clear(); }
  clear() { this.sources.clear(); this.held.clear(); this.pressed.clear(); this.buffer.clear(); }
  createTouch() {
    const root = document.getElementById('touch');
    root.innerHTML = `<div class="touch-move"><button data-action="left" aria-label="Move left">◀</button><button data-action="down" aria-label="Crouch">▼</button><button data-action="right" aria-label="Move right">▶</button><button data-action="jump" aria-label="Jump">↑</button></div><div class="touch-actions">${[['block','GUARD'],['dodge','DODGE'],['light','JAB'],['heavy','HEAVY'],['kick','KICK'],['grab','GRAB'],['special','FURY'],['use','USE'],['drop','DROP']].map(([action,label])=>`<button data-action="${action}" aria-label="${label}">${label}</button>`).join('')}</div>`;
    root.querySelectorAll('button').forEach(button => {
      const release = event => { this.set(`touch:${event.pointerId}`, button.dataset.action, false); button.classList.remove('active'); };
      button.addEventListener('pointerdown', event => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.set(`touch:${event.pointerId}`, button.dataset.action, true, 'touch');
        button.classList.add('active');
        navigator.vibrate?.(8);
      });
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });
  }
  showTouch(visible) { document.getElementById('touch').hidden = !(visible && this.touchEnabled); }
}
