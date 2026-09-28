import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Search...', label = 'Search' }) {
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-full bg-surface py-2.5 pl-11 pr-4 text-body text-text shadow-md placeholder:italic placeholder:text-primary focus:outline-none focus:ring-2 focus:ring-text"
      />
    </div>
  )
}
