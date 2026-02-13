import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Restart Mode
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Combination Lock Demo</h1>
        <p className="mt-4 text-slate-600">
          UI reset complete. Next implementation pass should follow the plan in{' '}
          <code>plan.md</code>.
        </p>
      </div>
    </main>
  )
}
