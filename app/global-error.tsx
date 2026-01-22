"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for root layout errors.
 * This component must define its own <html> and <body> tags
 * since it replaces the root layout when triggered.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to console in production, to logger in development
    console.error("Global error boundary caught error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h1 className="mb-2 text-xl font-semibold">
                Something went wrong
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                We&apos;re sorry, but something unexpected happened. Please try
                again.
              </p>
              {process.env.NODE_ENV === "development" && (
                <div className="mb-6 rounded-md bg-muted p-3 text-left">
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </button>
                <a
                  href="/"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
