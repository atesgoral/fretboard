import type { ButtonHTMLAttributes, ReactNode } from 'react'

type IconButtonProps = {
  title: string
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export default function IconButton({ title, children, className, ...props }: IconButtonProps) {
  return (
    <span title={title} className="inline-flex">
      <button type="button" title={title} aria-label={title} className={className} {...props}>
        {children}
      </button>
    </span>
  )
}
