import {
  configureAssistant,
  getSubjectsColor,
  quoteFilterValue,
  toIlikePattern,
} from "@/lib/utils";

describe("utils", () => {
  it("returns the configured subject color", () => {
    expect(getSubjectsColor("science")).toBe("#E5D0FF");
  });

  it("builds the assistant config with the expected voice", () => {
    const assistant = configureAssistant("female", "formal");
    const voice = assistant.voice as { voiceId?: string };

    expect(voice.voiceId).toBe("sarah");
    expect(assistant.model?.messages?.[0]?.role).toBe("system");
  });

  it("falls back to the default voice for unknown voice/style values", () => {
    const voice = configureAssistant("robot", "weird").voice as {
      voiceId?: string;
    };

    expect(voice.voiceId).toBe("sarah");
  });

  it("caps the call length at the companion duration", () => {
    expect(configureAssistant("male", "casual", 15).maxDurationSeconds).toBe(900);
    expect(configureAssistant("male", "casual").maxDurationSeconds).toBeUndefined();
  });

  it("escapes LIKE wildcards and quotes filter values", () => {
    expect(toIlikePattern("50%_off")).toBe("%50\\%\\_off%");
    expect(quoteFilterValue('a,"b"')).toBe('"a,\\"b\\""');
  });
});
