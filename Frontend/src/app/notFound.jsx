import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          The page you are looking for does not exist or was moved.
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80"
          >
            Go to home
          </Link>
        </div>
      </section>
    </main>
  );
}
