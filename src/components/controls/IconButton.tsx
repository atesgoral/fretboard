import type { ButtonHTMLAttributes, ReactNode } from 'react'

type IconButtonProps = {
  title: string
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export default function IconButton({ title, children, className, ...props }: IconButtonProps) {
  const wrapperClassName = `group relative inline-flex${props.disabled ? ' cursor-default' : ''}`
  const buttonClassName = `${className ?? ''}${props.disabled ? ' pointer-events-none' : ''}`

  return (
    <span title={title} className={wrapperClassName}>
      <button type="button" title={title} aria-label={title} className={buttonClassName} {...props}>
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-0 z-50 hidden -translate-x-1/2 -translate-y-2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-100 shadow-sm group-hover:block group-focus-within:block dark:bg-zinc-100 dark:text-zinc-900"
      >
        {title}
      </span>
    </span>
  )
}
