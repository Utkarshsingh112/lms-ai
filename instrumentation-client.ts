// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Kept deliberately light: every byte here ships to every visitor. Session
// Replay (~40 kB gzipped) was removed, and traces are sampled instead of
// recorded for every page view. Errors are still captured in full.
Sentry.init({
  dsn: "https://15d649628f18a22fa8a77fcf3e17a681@o4510080139067392.ingest.us.sentry.io/4510080145358863",

  tracesSampleRate: 0.1,

  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
