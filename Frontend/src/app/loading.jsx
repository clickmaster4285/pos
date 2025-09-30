export default function Loading() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 text-sm text-zinc-600"
      >
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"
          aria-hidden="true"
        />
        Loading…
      </div>
    </main>
  );
}
