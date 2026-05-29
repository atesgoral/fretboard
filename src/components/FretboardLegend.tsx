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

const scaleCircleClass =
  'border-amber-900/20 bg-amber-500 dark:border-amber-200/30 dark:bg-amber-300'
const chordCircleClass = 'border-blue-900/30 bg-blue-500 dark:border-blue-200/40 dark:bg-blue-300'
const lastPlayedCircleClass =
  'border-purple-900/40 bg-purple-500 dark:border-purple-200/50 dark:bg-purple-300'

type LegendItem = {
  symbol: string
  label: string
}

type LegendRowProps = {
  circleClass: string
  prefix: string
  items?: ReadonlyArray<LegendItem>
  textClass: string
}

function LegendCircle({ className }: { className: string }) {
  return <span className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full border ${className}`} />
}

function LegendRow({ circleClass, prefix, items = [], textClass }: LegendRowProps) {
  const symbolClass = `${textClass} font-semibold`

  return (
    <div className={`grid grid-cols-[auto_1fr] items-start gap-x-1.5 text-[11px] ${textClass}`}>
      <span className="pt-0.5">
        <LegendCircle className={circleClass} />
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="whitespace-nowrap font-medium">{prefix}</span>
        {items.map((item) => (
          <span key={`${item.symbol}-${item.label}`} className="whitespace-nowrap">
            <span className={symbolClass}>{item.symbol}</span>
            {'\u00A0'}
            <span>{item.label}</span>
          </span>
        ))}
      </span>
    </div>
  )
}

export default function FretboardLegend() {
  return (
    <div className="mt-1 flex flex-col items-start gap-y-1">
      <LegendRow
        circleClass={scaleCircleClass}
        prefix="Scale functions:"
        items={SCALE_FUNCTION_ITEMS}
        textClass={scaleLegendTextClass}
      />
      <LegendRow
        circleClass={chordCircleClass}
        prefix="Chord functions:"
        items={CHORD_FUNCTION_ITEMS}
        textClass={chordLegendTextClass}
      />
      <LegendRow
        circleClass={lastPlayedCircleClass}
        prefix="Last played"
        textClass={lastPlayedLegendTextClass}
      />
    </div>
  )
}
