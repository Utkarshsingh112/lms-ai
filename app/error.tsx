"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

const ErrorPage = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="items-center justify-center pt-20 text-center">
      <h1>Something went wrong</h1>
      <p className="text-muted-foreground">
        We hit a problem loading this page. Give it another try, or head back
        home.
      </p>
      <div className="flex justify-center gap-4">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-signin">
          Go home
        </Link>
      </div>
    </main>
  );
};

export default ErrorPage;
