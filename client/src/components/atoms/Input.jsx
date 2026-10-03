import { useId } from 'react'
import { ChevronDown } from 'lucide-react'

const FIELD =
  'min-h-[3rem] w-full appearance-none rounded-2xl bg-text/[0.05] px-4 py-3 text-body text-text ring-1 ring-inset ring-transparent transition duration-200 ease-ios placeholder:text-primary/70 hover:bg-text/[0.07] focus:bg-surface focus:shadow-card focus:outline-none focus:ring-2 focus:ring-text disabled:opacity-60'

export default function Input({ label, id, as: Tag = 'input', className = '', children, ...rest }) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const isSelect = Tag === 'select'

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="pl-1 text-small font-medium text-primary">
          {label}
          {rest.required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <div className="relative">
        <Tag id={fieldId} className={`${FIELD} ${isSelect ? 'pr-10' : ''} ${className}`} {...rest}>
          {children}
        </Tag>
        {isSelect && (
          <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary" />
        )}
      </div>
    </div>
  )
}
