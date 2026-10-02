import type Vapi from "@vapi-ai/web";

// A scripted stand-in for the Vapi web SDK, used only for local UI work
// (NEXT_PUBLIC_MOCK_VAPI=true outside production). It replays a short tutoring
// conversation with partial transcripts and volume levels so the whole session
// screen can be exercised without a Vapi account or microphone.

type Listener = (...args: unknown[]) => void;

const SCRIPT: Array<{ role: "assistant" | "user"; text: string }> = [
  {
    role: "assistant",
    text: "Hello! Today we're going to explore {topic}. Have you come across it before?",
  },
  { role: "user", text: "A little, but I'd love a clear overview first." },
  {
    role: "assistant",
    text: "Perfect. Let's break it into small pieces and take them one at a time, starting with the big picture.",
  },
  { role: "user", text: "Okay, that makes sense. What comes first?" },
  {
    role: "assistant",
    text: "The key idea is that everything builds on a few simple principles. Does that sound clear so far?",
  },
  { role: "user", text: "Yes, please give me an example." },
];

class MockVapi {
  private listeners = new Map<string, Set<Listener>>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private running = false;
  private muted = false;
  private topic = "this topic";

  on(event: string, listener: Listener) {
    const set = this.listeners.get(event) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(event, set);
    return this;
  }

  off(event: string, listener: Listener) {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  isMuted() {
    return this.muted;
  }

  setMuted(value: boolean) {
    this.muted = value;
  }

  start(_assistant?: unknown, overrides?: { variableValues?: { topic?: string } }) {
    this.topic = overrides?.variableValues?.topic ?? this.topic;
    this.running = true;
    this.later(700, () => {
      this.emit("call-start");
      this.playLine(0);
    });
    return Promise.resolve(null);
  }

  stop() {
    if (!this.running) {
      return;
    }

    this.running = false;
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.later(50, () => this.emit("call-end"));
  }

  private emit(event: string, ...args: unknown[]) {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }

  private later(ms: number, fn: () => void) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      fn();
    }, ms);
    this.timers.add(timer);
  }

  private playLine(index: number) {
    if (!this.running) {
      return;
    }

    const { role, text } = SCRIPT[index % SCRIPT.length];
    const words = text.replace("{topic}", this.topic).split(" ");
    const isAssistant = role === "assistant";
    const wordDelay = isAssistant ? 170 : 140;

    if (isAssistant) {
      this.emit("speech-start");
    }

    words.forEach((_, wordIndex) => {
      this.later(wordIndex * wordDelay, () => {
        this.emit("message", {
          type: "transcript",
          transcriptType: "partial",
          role,
          transcript: words.slice(0, wordIndex + 1).join(" "),
        });
      });
    });

    if (isAssistant) {
      const total = words.length * wordDelay;
      for (let t = 0; t < total; t += 90) {
        this.later(t, () =>
          this.emit("volume-level", 0.08 + Math.random() * 0.5)
        );
      }
    }

    const duration = words.length * wordDelay + 250;
    this.later(duration, () => {
      this.emit("message", {
        type: "transcript",
        transcriptType: "final",
        role,
        transcript: words.join(" "),
      });
      if (isAssistant) {
        this.emit("volume-level", 0);
        this.emit("speech-end");
      }
      this.later(900, () => this.playLine(index + 1));
    });
  }
}

export const createMockVapi = () => new MockVapi() as unknown as Vapi;
