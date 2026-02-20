import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <section className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Webchat for LINE Official Account</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Next.js App Router + TypeScript starter with a simple chat screen.
        </p>
        <Link
          href="/chat"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Open Chat
        </Link>
      </section>
    </main>
  );
}
