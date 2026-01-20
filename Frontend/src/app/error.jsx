"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  // Optional: send to your logging tool
  useEffect(() => {
    // console.error(error);
  }, [error]);

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <section
        role="alert"
        aria-live="assertive"
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white/90 backdrop-blur p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90"
      >
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {error?.message || "An unexpected error occurred."}
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => reset?.()}
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80"
          >
            Try again
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80"
          >
            Go home
          </a>
        </div>

        <details className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 wrap-break-word whitespace-pre-wrap">
          <summary className="cursor-pointer select-none">Details</summary>
          {String(error ?? "")}
        </details>
      </section>
    </main>
  );
}
