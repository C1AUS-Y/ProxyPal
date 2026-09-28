import { useId } from 'react'

const FIELD =
  'w-full bg-surface px-4 py-2.5 text-body text-text shadow-md placeholder:italic placeholder:text-primary focus:outline-none focus:ring-2 focus:ring-text disabled:opacity-60'

// One component for text inputs, selects and textareas, so every field on every
// screen has the same label, shape and focus ring. Every field gets a real
// <label> tied to it with htmlFor/id.
export default function Input({ label, id, as: Tag = 'input', className = '', children, ...rest }) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const shape = Tag === 'textarea' ? 'rounded-2xl' : 'rounded-full'

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="pl-1 text-small font-medium text-primary">
          {label}
          {rest.required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <Tag id={fieldId} className={`${FIELD} ${shape} ${className}`} {...rest}>
        {children}
      </Tag>
    </div>
  )
}
