export class Synth {
  constructor() { this.enabled = false; this.context = null; }
  async toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) { this.enabled = false; return false; }
      this.context ||= new AudioContext();
      try { await this.context.resume(); } catch { this.enabled = false; }
      if (this.enabled) this.play('pickup');
    }
    return this.enabled;
  }
  play(event) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const notes = event === 'hit' ? [120, 70] : event === 'delivery' ? [440, 554, 660, 880] : [440, 660];
    notes.forEach((frequency, i) => {
      const oscillator = this.context.createOscillator(), gain = this.context.createGain();
      const start = this.context.currentTime + i * .09;
      oscillator.type = event === 'hit' ? 'sawtooth' : 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.06, start + .01); gain.gain.exponentialRampToValueAtTime(.001, start + .15);
      oscillator.connect(gain); gain.connect(this.context.destination); oscillator.start(start); oscillator.stop(start + .16);
    });
  }
}
