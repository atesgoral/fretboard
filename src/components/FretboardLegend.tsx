const LEGEND_ITEMS = [
  { symbol: 'R', label: 'Tonic (scale degree 1)' },
  { symbol: 'b', label: 'Flat' },
  { symbol: '#', label: 'Sharp' },
  { symbol: '2-7', label: 'Scale degrees relative to the tonic' },
] as const

export default function FretboardLegend() {
  return (
    <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
      {LEGEND_ITEMS.map((item) => (
        <span key={item.symbol} className="inline-flex items-center gap-1.5">
          <span className="inline-flex min-w-6 items-center justify-center rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {item.symbol}
          </span>
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  )
}
