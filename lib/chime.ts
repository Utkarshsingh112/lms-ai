// Tiny Web Audio chimes for session start/end. No audio assets needed.

let audioContext: AudioContext | null = null;

const NOTES = {
  start: [523.25, 659.25, 783.99],
  end: [659.25, 523.25],
} as const;

export const playChime = (kind: keyof typeof NOTES) => {
  if (typeof window === "undefined") {
    return;
  }

  const Ctor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!Ctor) {
    return;
  }

  try {
    audioContext ??= new Ctor();
    const context = audioContext;
    void context.resume();

    NOTES[kind].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startAt = context.currentTime + index * 0.14;

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.1, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.45);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.5);
    });
  } catch (error) {
    console.error("Could not play chime:", error);
  }
};

const STORAGE_KEY = "lms-ai:sounds";

export const readSoundPreference = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
};

export const writeSoundPreference = (enabled: boolean) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Preference is a convenience only.
  }
};
