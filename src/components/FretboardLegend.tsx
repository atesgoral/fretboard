const SCALE_FUNCTION_ITEMS = [
  { symbol: '1–7', label: 'Degrees relative to the tonic' },
  { symbol: 'b', label: 'Flat' },
  { symbol: '#', label: 'Sharp' },
] as const

const CHORD_FUNCTION_ITEMS = [
  { symbol: 'R', label: 'Chord root' },
  { symbol: '2–7', label: 'Degrees relative to the chord root' },
] as const

const scaleLegendTextClass = 'text-amber-900 dark:text-amber-200'
const chordLegendTextClass = 'text-blue-900 dark:text-blue-200'
const lastPlayedLegendTextClass = 'text-purple-900 dark:text-purple-200'

type LegendItem = {
  symbol: string
  label: string
}

type LegendRowProps = {
  prefix: string
  items: ReadonlyArray<LegendItem>
  textClass: string
}

function LegendRow({ prefix, items, textClass }: LegendRowProps) {
  const symbolClass = `${textClass} font-semibold`

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] ${textClass}`}
    >
      <span className="font-medium">{prefix}</span>
      {items.map((item) => (
        <span key={`${item.symbol}-${item.label}`} className="inline-flex items-center gap-1.5">
          <span className={symbolClass}>{item.symbol}</span>
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  )
}

export default function FretboardLegend() {
  return (
    <div className="mt-1 flex flex-col items-center gap-y-1">
      <LegendRow
        prefix="Scale functions:"
        items={SCALE_FUNCTION_ITEMS}
        textClass={scaleLegendTextClass}
      />
      <LegendRow
        prefix="Chord functions:"
        items={CHORD_FUNCTION_ITEMS}
        textClass={chordLegendTextClass}
      />
      <p className={`text-center text-[11px] font-medium ${lastPlayedLegendTextClass}`}>
        Last played
      </p>
    </div>
  )
}
