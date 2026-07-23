import { useState } from 'react'

export default function Header() {
  const [searchFocused, setSearchFocused] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <header className="h-14 shrink-0 flex items-center gap-4 px-6 border-b border-gray-200 bg-white shadow-panel">
      {/* Search */}
      <div
        className={`flex-1 flex items-center gap-2 max-w-xl px-3 py-2 rounded-lg border transition-colors ${
          searchFocused ? 'border-do-blue ring-1 ring-do-blue/20' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by resource name or public IP (Cmd+B)"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {/* Create button */}
      <div className="relative">
        <button
          onClick={() => setCreateOpen(!createOpen)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
        >
          Create
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {createOpen && (
          <div className="absolute right-0 mt-1 w-48 py-1 bg-white rounded-lg border border-gray-200 shadow-lg z-20">
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Droplet</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Kubernetes</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">App Platform</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Database</a>
          </div>
        )}
      </div>

      {/* Right group */}
      <div className="flex items-center gap-2">
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[10px] font-semibold text-white bg-red-500 rounded-full">
            2
          </span>
        </button>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <span className="text-sm text-gray-600">Design Onboarding</span>
        <span className="text-sm text-gray-500">Estimated costs: $0.00</span>
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-do-blue text-white text-xs font-semibold">
          DO
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-do-blue to-blue-600 text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </header>
  )
}
