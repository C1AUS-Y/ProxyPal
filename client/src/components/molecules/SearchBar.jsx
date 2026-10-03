import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Search...', label = 'Search' }) {
  return (
    <div className="relative">
      <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-12 w-full appearance-none rounded-full bg-text/[0.06] pl-11 pr-11 text-body text-text ring-1 ring-inset ring-transparent transition duration-200 ease-ios placeholder:text-primary focus:bg-surface focus:shadow-card focus:outline-none focus:ring-2 focus:ring-text [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange({ target: { value: '' } })}
          className="pop press absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-text/15 text-text"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
