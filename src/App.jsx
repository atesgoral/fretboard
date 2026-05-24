export default function App() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-24 text-center">
        <p className="rounded-full border border-violet-400/50 bg-violet-500/10 px-4 py-1 text-sm font-medium text-violet-200">
          Vite + React + Tailwind
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Ready for GitHub Pages</h1>
        <p className="max-w-2xl text-lg text-slate-300">
          This starter is configured for local development and automated deployment with GitHub Actions.
        </p>
      </section>
    </main>
  )
}
