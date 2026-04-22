import { configureAssistant, getSubjectsColor } from "@/lib/utils";

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
});
