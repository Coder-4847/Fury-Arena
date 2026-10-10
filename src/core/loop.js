export class FixedLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.step = 1 / 60;
    this.accumulator = 0;
    this.last = 0;
    this.frame = this.frame.bind(this);
  }
  start() { requestAnimationFrame(this.frame); }
  frame(now) {
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 0;
    this.last = now;
    this.accumulator += dt;
    while (this.accumulator >= this.step) {
      this.update(this.step);
      this.accumulator -= this.step;
    }
    this.render(this.accumulator / this.step, dt);
    requestAnimationFrame(this.frame);
  }
}
