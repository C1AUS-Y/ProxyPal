// iOS-style segmented control. The white thumb slides to the chosen option.
export default function Segmented({ options, value, onChange, label }) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )

  return (
    <div role="radiogroup" aria-label={label} className="relative grid grid-flow-col auto-cols-fr rounded-full bg-text/[0.06] p-1">
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-full bg-surface shadow-card ring-1 ring-text/[0.06] transition-transform duration-500 ease-ios"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 rounded-full px-3 py-2 text-small font-semibold transition-colors duration-300 ${
            option.value === value ? 'text-text' : 'text-primary hover:text-text'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
