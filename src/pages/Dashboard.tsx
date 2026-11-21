import { useEffect, useMemo, useState } from 'react'
import BarChart from '../components/BarChart'
import LineChart from '../components/LineChart'
import { loadDataset, METRICS, type Row } from '../lib/dataset'

export default function Dashboard() {
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)
  const [metric, setMetric] = useState(METRICS[0].key)
  const [year, setYear] = useState(2022)

  useEffect(() => {
    loadDataset()
      .then(setRows)
      .catch((e: Error) => setError(e.message))
  }, [])

  const active = METRICS.find((m) => m.key === metric) ?? METRICS[0]

  const years = useMemo(
    () => [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b),
    [rows],
  )

  const latest = useMemo(
    () => rows.find((r) => r.region_code === 'CZ' && r.year === year) ?? null,
    [rows, year],
  )

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-10 text-left">
        <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-800">
          <h1 className="text-lg font-semibold">Dataset could not be loaded</h1>
          <p className="mt-2 text-sm">{error}</p>
          <p className="mt-2 text-sm">
            Run{' '}
            <code className="rounded bg-red-100 px-1">python3 dataset/build_dataset.py</code>{' '}
            first.
          </p>
        </div>
      </main>
    )
  }

  if (!rows.length) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-slate-500">Loading dataset…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-left">
      <header className="mb-8">
        <a
          href="#/"
          className="text-sm text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
        >
          ← Back to template
        </a>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Economic differences across Czech regions
        </h1>
        <p className="mt-2 text-slate-600">
          {rows.length} rows · {years[0]}–{years[years.length - 1]} · 14 regions + Czechia
        </p>
      </header>

      <section className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Indicator
          </span>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Year
          </span>
          <input
            type="range"
            min={years[0]}
            max={years[years.length - 1]}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-56 accent-slate-800"
          />
        </label>

        <div className="ml-auto text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Czechia · {year}
          </p>
          <p className="text-2xl font-semibold text-slate-900">
            {latest && latest[metric] != null
              ? active.format(latest[metric] as number)
              : '—'}
          </p>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {active.label} over time
        </h2>
        <LineChart rows={rows} metric={metric} format={active.format} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {active.label} by region · {year}
        </h2>
        <BarChart rows={rows} metric={metric} format={active.format} year={year} />
      </section>

      <footer className="mt-8 text-xs text-slate-500">
        Source: Czech Statistical Office (CZSO) · built by{' '}
        <code className="rounded bg-slate-100 px-1">dataset/build_dataset.py</code>
      </footer>
    </main>
  )
}
