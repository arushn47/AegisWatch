/**
 * Tactical audio synthesizer for AegisWatch alerts.
 * Uses Web Audio API oscillator synthesis so no external audio files are required.
 * Honors the 'aegis_silent_mode' setting stored in localStorage.
 */

export function isSilentModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('aegis_silent_mode') === 'true';
}

export function setSilentModeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('aegis_silent_mode', enabled ? 'true' : 'false');
}

export function playTacticalAlertSound(options?: { test?: boolean }): void {
  if (typeof window === 'undefined') return;
  if (!options?.test && isSilentModeEnabled()) return;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Mission-control two-tone tactical blip
    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.16); // A6

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);

    // Clean up audio context
    setTimeout(() => {
      try {
        void ctx.close();
      } catch {
        /* noop */
      }
    }, 400);
  } catch {
    // Audio autoplay blocked or unsupported - fail silently
  }
}
