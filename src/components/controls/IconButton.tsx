import type { ButtonHTMLAttributes, ReactNode } from 'react'

type IconButtonProps = {
  title: string
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export default function IconButton({ title, children, className, ...props }: IconButtonProps) {
  const wrapperClassName = `inline-flex${props.disabled ? ' cursor-default' : ''}`
  const buttonClassName = `${className ?? ''}${props.disabled ? ' pointer-events-none' : ''}`

  return (
    <span title={title} className={wrapperClassName}>
      <button type="button" title={title} aria-label={title} className={buttonClassName} {...props}>
        {children}
      </button>
    </span>
  )
}
