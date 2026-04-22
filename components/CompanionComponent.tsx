"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { LottieRefCurrentProps } from "lottie-react";
import type Vapi from "@vapi-ai/web";

import soundwaves from "@/constants/soundwaves.json";
import { addToSessionHistory } from "@/lib/actions/companions.action";
import { cn, configureAssistant, getSubjectsColor } from "@/lib/utils";
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
}: CompanionComponentProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const vapiRef = useRef<Vapi | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

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
        setCallStatus(CallStatus.ACTIVE);
      };

      const onCallEnd = () => {
        setCallStatus(CallStatus.FINISHED);
        void addToSessionHistory(companionId).catch((error) => {
          console.error("Failed to save session history:", error);
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

          setMessages((prev) => [
            nextMessage,
            ...prev,
          ]);
        }
      };

      const onSpeechStart = () => setIsSpeaking(true);
      const onSpeechEnd = () => setIsSpeaking(false);
      const onError = (error: Error) => {
        console.error("Vapi error:", error);
        setSessionError(
          "The voice session failed to start. Check your setup and try again."
        );
        setCallStatus(CallStatus.INACTIVE);
      };

      vapi.on("call-start", onCallStart);
      vapi.on("call-end", onCallEnd);
      vapi.on("message", onMessage);
      vapi.on("error", onError);
      vapi.on("speech-start", onSpeechStart);
      vapi.on("speech-end", onSpeechEnd);

      cleanupRef.current = () => {
        vapi.off("call-start", onCallStart);
        vapi.off("call-end", onCallEnd);
        vapi.off("message", onMessage);
        vapi.off("error", onError);
        vapi.off("speech-start", onSpeechStart);
        vapi.off("speech-end", onSpeechEnd);
      };
    };

    void setupVapi();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [companionId]);

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
    setCallStatus(CallStatus.CONNECTING);

    const assistantOverrides = {
      variableValues: { subject, topic, style },
      clientMessages: ["transcript"],
      serverMessages: [],
    };

    // @ts-expect-error - Vapi library has incomplete TypeScript definitions for assistantOverrides parameter
    vapi.start(configureAssistant(voice, style), assistantOverrides);
  };

  const handleDisconnect = () => {
    const vapi = vapiRef.current;

    if (!vapi) {
      setSessionError("The voice session is not available right now.");
      return;
    }

    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <section className="flex-col h-[70vh]">
      <section className="flex gap-8 max-sm:flex-col">
        <div className="companion-section">
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
          <p className="font-bold text-2xl">{name}</p>
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
            type="button"
          >
            <Image
              src={isMuted ? "/icons/mic-off.svg" : "/icons/mic-on.svg"}
              alt="mic"
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
            type="button"
          >
            {callStatus === CallStatus.ACTIVE
              ? "End Session"
              : callStatus === CallStatus.CONNECTING
                ? "Connecting"
                : "Start Session"}
          </button>
        </div>
      </section>

      <section className="transcript">
        <div className="transcript-message no-scrollbar">
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
