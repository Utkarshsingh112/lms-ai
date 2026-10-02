"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { LottieRefCurrentProps } from "lottie-react";
import type Vapi from "@vapi-ai/web";

import CompanionOrb, { type OrbState } from "@/components/CompanionOrb";
import soundwaves from "@/constants/soundwaves.json";
import { addToSessionHistory } from "@/lib/actions/companions.action";
import {
  cn,
  configureAssistant,
  formatClock,
  getSubjectsColor,
} from "@/lib/utils";
import { getVapi } from "@/lib/vapi.sdk";
import type { CompanionComponentProps, SavedMessage } from "@/types/companion";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

type TranscriptMessage = {
  type?: string;
  transcriptType?: string;
  role?: SavedMessage["role"];
  transcript?: string;
};

const blurDataUrl =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxNicgaGVpZ2h0PScxNic+PHJlY3Qgd2lkdGg9JzE2JyBoZWlnaHQ9JzE2JyBmaWxsPScjZjNlNmVmJy8+PC9zdmc+";

const CompanionComponent = ({
  companionId,
  subject,
  topic,
  name,
  userName,
  userImage,
  style,
  voice,
  duration,
}: CompanionComponentProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const callStatusRef = useRef<CallStatus>(CallStatus.INACTIVE);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const vapiRef = useRef<Vapi | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const setStatus = useCallback((status: CallStatus) => {
    callStatusRef.current = status;
    setCallStatus(status);
  }, []);

  const syncElapsed = useCallback(() => {
    if (startedAtRef.current !== null) {
      setElapsedSeconds(
        Math.floor((Date.now() - startedAtRef.current) / 1000)
      );
    }
  }, []);

  // Tick the session clock while the call is live.
  useEffect(() => {
    if (callStatus !== CallStatus.ACTIVE) {
      return;
    }

    const interval = setInterval(syncElapsed, 1000);
    return () => clearInterval(interval);
  }, [callStatus, syncElapsed]);

  // Keep the newest transcript line in view.
  useEffect(() => {
    const element = transcriptRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isSpeaking) {
      lottieRef.current?.play();
      return;
    }

    lottieRef.current?.stop();
  }, [isSpeaking]);

  useEffect(() => {
    let cancelled = false;

    const setupVapi = async () => {
      const vapi = await getVapi();

      if (!vapi || cancelled) {
        return;
      }

      vapiRef.current = vapi;

      const onCallStart = () => {
        setSessionError(null);
        startedAtRef.current = Date.now();
        setElapsedSeconds(0);
        setStatus(CallStatus.ACTIVE);
      };

      const onCallEnd = () => {
        syncElapsed();
        setIsSpeaking(false);
        setStatus(CallStatus.FINISHED);
        void addToSessionHistory(companionId).catch((error) => {
          console.error("Failed to save session history:", error);
          setHistoryError(true);
        });
      };

      const onMessage = (message: TranscriptMessage) => {
        if (
          message.type === "transcript" &&
          message.transcriptType === "final" &&
          message.role &&
          message.transcript
        ) {
          const nextMessage: SavedMessage = {
            role: message.role,
            content: message.transcript,
          };

          setMessages((prev) => [...prev, nextMessage]);
        }
      };

      // Drives the orb's pulse straight on the DOM node (no re-render per frame).
      const onVolume = (level: number) => {
        orbRef.current?.style.setProperty(
          "--level",
          Math.min(1, Math.max(0, level)).toFixed(3)
        );
      };

      const onSpeechStart = () => setIsSpeaking(true);
      const onSpeechEnd = () => setIsSpeaking(false);
      const onError = (error: Error) => {
        console.error("Vapi error:", error);
        setSessionError(
          "The voice session failed to start. Check your setup and try again."
        );
        setStatus(CallStatus.INACTIVE);
      };

      vapi.on("call-start", onCallStart);
      vapi.on("call-end", onCallEnd);
      vapi.on("message", onMessage);
      vapi.on("error", onError);
      vapi.on("speech-start", onSpeechStart);
      vapi.on("volume-level", onVolume);
      vapi.on("speech-end", onSpeechEnd);

      cleanupRef.current = () => {
        vapi.off("call-start", onCallStart);
        vapi.off("call-end", onCallEnd);
        vapi.off("message", onMessage);
        vapi.off("error", onError);
        vapi.off("speech-start", onSpeechStart);
        vapi.off("volume-level", onVolume);
        vapi.off("speech-end", onSpeechEnd);
      };
    };

    void setupVapi();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;

      // Leaving the page must not leave the microphone call running.
      if (
        callStatusRef.current === CallStatus.ACTIVE ||
        callStatusRef.current === CallStatus.CONNECTING
      ) {
        vapiRef.current?.stop();
      }
    };
  }, [companionId, setStatus, syncElapsed]);

  const toggleMicrophone = () => {
    const vapi = vapiRef.current;

    if (!vapi) {
      setSessionError("The voice session is not available right now.");
      return;
    }

    const nextMutedState = !vapi.isMuted();
    vapi.setMuted(nextMutedState);
    setIsMuted(nextMutedState);
  };

  const remainingSeconds =
    duration && duration > 0
      ? Math.max(0, duration * 60 - elapsedSeconds)
      : null;

  const orbState: OrbState =
    callStatus === CallStatus.CONNECTING
      ? "connecting"
      : callStatus === CallStatus.ACTIVE
        ? isSpeaking
          ? "speaking"
          : "listening"
        : "idle";

  const handleCall = async () => {
    const vapi = await getVapi();
    vapiRef.current = vapi;

    if (!vapi) {
      setSessionError(
        "Missing voice session configuration. Add NEXT_PUBLIC_WEB_TOKEN and try again."
      );
      return;
    }

    setSessionError(null);
    setHistoryError(false);
    setMessages([]);
    setElapsedSeconds(0);
    startedAtRef.current = null;
    setStatus(CallStatus.CONNECTING);

    const assistantOverrides = {
      variableValues: { subject, topic, style },
      clientMessages: ["transcript"],
      serverMessages: [],
    };

    // @ts-expect-error - Vapi library has incomplete TypeScript definitions for assistantOverrides parameter
    vapi.start(configureAssistant(voice, style, duration), assistantOverrides);
  };

  const handleDisconnect = () => {
    const vapi = vapiRef.current;

    if (!vapi) {
      setSessionError("The voice session is not available right now.");
      return;
    }

    syncElapsed();
    setStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <section className="flex-col h-[70vh]">
      <p className="sr-only" role="status" aria-live="polite">
        {callStatus === CallStatus.CONNECTING
          ? "Connecting to your companion"
          : callStatus === CallStatus.ACTIVE
            ? "Session started"
            : callStatus === CallStatus.FINISHED
              ? "Session ended"
              : ""}
      </p>
      <section className="flex gap-8 max-sm:flex-col">
        <div className="companion-section">
          <CompanionOrb
            ref={orbRef}
            color={getSubjectsColor(subject)}
            state={orbState}
          >
            <div
              className="companion-avatar"
              style={{ backgroundColor: getSubjectsColor(subject) }}
            >
              <div
                className={cn(
                  "absolute transition-opacity duration-1000",
                  callStatus === CallStatus.FINISHED ||
                    callStatus === CallStatus.INACTIVE
                    ? "opacity-100"
                    : "opacity-0",
                  callStatus === CallStatus.CONNECTING &&
                    "opacity-100 animate-pulse"
                )}
              >
                <Image
                  src={`/icons/${subject}.svg`}
                  alt={subject}
                  width={150}
                  height={150}
                  className="max-sm:w-fit"
                  sizes="(max-width: 640px) 40vw, 150px"
                />
              </div>

              <div
                className={cn(
                  "absolute transition-opacity duration-1000",
                  callStatus === CallStatus.ACTIVE ? "opacity-100" : "opacity-0"
                )}
              >
                <Lottie
                  lottieRef={lottieRef}
                  animationData={soundwaves}
                  autoplay={false}
                  className="companion-lottie"
                />
              </div>
            </div>
          </CompanionOrb>
          <p className="font-bold text-2xl">{name}</p>
          <p
            className="flex items-center gap-2 text-sm text-muted-foreground"
            aria-hidden="true"
          >
            <span
              className={cn(
                "size-2 rounded-full",
                orbState === "speaking" && "bg-green-600 animate-pulse",
                orbState === "listening" && "bg-orange-500 animate-pulse",
                orbState === "connecting" && "bg-yellow-500 animate-pulse",
                orbState === "idle" && "bg-gray-400"
              )}
            />
            {orbState === "speaking"
              ? "Speaking"
              : orbState === "listening"
                ? "Listening"
                : orbState === "connecting"
                  ? "Connecting…"
                  : callStatus === CallStatus.FINISHED
                    ? "Session ended"
                    : "Ready when you are"}
          </p>
          {callStatus === CallStatus.ACTIVE ? (
            <p
              className={cn(
                "mb-4 text-lg font-medium tabular-nums",
                remainingSeconds !== null && remainingSeconds <= 60
                  ? "text-red-700"
                  : "text-muted-foreground"
              )}
              aria-label={
                remainingSeconds !== null
                  ? `${formatClock(remainingSeconds)} remaining`
                  : `${formatClock(elapsedSeconds)} elapsed`
              }
            >
              {remainingSeconds !== null
                ? `${formatClock(remainingSeconds)} left`
                : formatClock(elapsedSeconds)}
            </p>
          ) : null}
        </div>

        <div className="user-section">
          <div className="user-avatar">
            <Image
              src={userImage}
              alt={userName}
              width={130}
              height={130}
              className="rounded-lg"
              sizes="(max-width: 640px) 32vw, 130px"
              placeholder="blur"
              blurDataURL={blurDataUrl}
            />
            <p className="font-bold text-2xl">{userName}</p>
          </div>

          <button
            className="btn-mic"
            onClick={toggleMicrophone}
            disabled={callStatus !== CallStatus.ACTIVE}
            aria-pressed={isMuted}
            aria-label="Microphone"
            type="button"
          >
            <Image
              src={isMuted ? "/icons/mic-off.svg" : "/icons/mic-on.svg"}
              alt=""
              width={36}
              height={36}
              sizes="36px"
            />
            <p className="max-sm:hidden">
              {isMuted ? "Turn on microphone" : "Turn off microphone"}
            </p>
          </button>

          {sessionError ? (
            <p className="text-sm text-red-600" role="alert">
              {sessionError}
            </p>
          ) : null}

          <button
            className={cn(
              "rounded-lg py-2 cursor-pointer transition-colors w-full text-white",
              callStatus === CallStatus.ACTIVE ? "bg-red-700" : "bg-primary",
              callStatus === CallStatus.CONNECTING && "animate-pulse"
            )}
            onClick={
              callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall
            }
            disabled={callStatus === CallStatus.CONNECTING}
            type="button"
          >
            {callStatus === CallStatus.ACTIVE
              ? "End Session"
              : callStatus === CallStatus.CONNECTING
                ? "Connecting"
                : callStatus === CallStatus.FINISHED
                  ? "Start Another Session"
                  : "Start Session"}
          </button>
        </div>
      </section>

      {callStatus === CallStatus.FINISHED ? (
        <section
          className="rounded-border mt-6 flex flex-col gap-3 p-6"
          aria-label="Session summary"
        >
          <h2 className="text-2xl font-bold">Session complete</h2>
          <p className="text-muted-foreground">
            You spent {formatClock(elapsedSeconds)} on {topic} with{" "}
            {name.split(" ")[0].replace(/[.,]/g, "")}
            {messages.length > 0
              ? ` across ${messages.length} ${
                  messages.length === 1 ? "message" : "messages"
                }.`
              : "."}
          </p>
          {historyError ? (
            <p className="text-sm text-red-600" role="alert">
              We couldn&apos;t save this session to your history.
            </p>
          ) : null}
          <div className="flex gap-4">
            <Link href="/companions" className="btn-signin">
              Browse companions
            </Link>
            <Link href="/my-journey" className="btn-signin">
              My journey
            </Link>
          </div>
        </section>
      ) : null}

      <section className="transcript">
        {messages.length === 0 && callStatus !== CallStatus.FINISHED ? (
          <p className="absolute top-12 z-20 text-center text-lg text-muted-foreground max-sm:text-base">
            {callStatus === CallStatus.ACTIVE
              ? "Say hello — your tutor is listening."
              : "Press Start Session and your conversation will appear here."}
          </p>
        ) : null}
        <div
          ref={transcriptRef}
          className="transcript-message no-scrollbar"
          role="log"
          aria-label="Session transcript"
        >
          {messages.map((message, index) =>
            message.role === "assistant" ? (
              <p key={index} className="max-sm:text-sm">
                {name.split(" ")[0].replace(/[.,]/g, "")}: {message.content}
              </p>
            ) : (
              <p key={index} className="text-primary max-sm:text-sm">
                {userName}: {message.content}
              </p>
            )
          )}
        </div>
        <div className=" transcript-fade" />
      </section>
    </section>
  );
};

export default CompanionComponent;
