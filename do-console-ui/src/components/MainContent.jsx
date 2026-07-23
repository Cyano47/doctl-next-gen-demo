const namespaces = [
  { name: 'urchin-fn-namespace', id: 'fn-4b09caad-62c0-41c8-afda-4dbb48df243e', created: 'about 3 years ago', region: 'TOR1', flag: '🇨🇦' },
  { name: 'monkfish-fn-namespace', id: 'fn-7a12bcde-31d0-52d9-bgeb-5ecc59ef354f', created: 'almost 3 years ago', region: 'SGP1', flag: '🇸🇬' },
  { name: 'seashell-ny-namespace', id: 'fn-8c23cdef-42e1-63ea-cfhc-6fdd60fg465g', created: 'almost 2 years ago', region: 'NYC1', flag: '🇺🇸' },
  { name: 'king-prawn-fn-namespace', id: 'fn-9d34defg-53f2-74fb-dgid-7gee71gh576h', created: 'over 1 year ago', region: 'TOR1', flag: '🇨🇦' },
  { name: 'oyster-fn-namespace', id: 'fn-0e45efgh-64g3-85gc-ehje-8hff82hi687i', created: 'about 1 year ago', region: 'NYC1', flag: '🇺🇸' },
  { name: 'goldfish-fn-namespace', id: 'fn-1f56fghi-75h4-96hd-fikf-9igg93ij798j', created: '7 months ago', region: 'SGP1', flag: '🇸🇬' },
  { name: 'coral-fn-namespace', id: 'fn-2g67ghij-86i5-07ie-gjlg-0jhh04jk809k', created: '3 months ago', region: 'NYC1', flag: '🇺🇸' },
  { name: 'test', id: 'fn-3h78hijk-97j6-18jf-hkmh-1kii15kl910l', created: 'about 2 months ago', region: 'TOR1', flag: '🇨🇦' },
]

const buildCards = [
  {
    title: 'APP PLATFORM',
    description: 'Add and manage functions as components of your app.',
    cta: 'Create an app',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    title: 'GENERATIVE AI',
    description: 'Power generative AI agents using functions.',
    cta: 'Create an AI agent',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'MANAGED DATABASES',
    description: 'Access persistent data with a managed database.',
    cta: 'Create a managed database',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
  },
]

function NamespaceIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
    </svg>
  )
}

export default function MainContent() {
  return (
    <div className="flex-1 overflow-y-auto p-6 min-w-0">
      {/* Namespaces section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Namespaces</h1>
          <div className="flex items-center gap-3">
            <a href="#" className="text-sm text-do-blue hover:underline flex items-center gap-1">
              Learn
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <button className="px-4 py-2 bg-do-blue hover:bg-do-blue-dark text-white text-sm font-medium rounded-lg">
              Create Namespace
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-panel">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Created</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Region</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {namespaces.map((ns) => (
                <tr
                  key={ns.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <NamespaceIcon />
                      <div>
                        <div className="font-medium text-gray-900">{ns.name}</div>
                        <div className="text-gray-500 text-xs">{ns.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{ns.created}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base" role="img" aria-hidden>{ns.flag}</span>
                      <span className="text-gray-600">{ns.region}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Build on what you have */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Build on what you have</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {buildCards.map((card) => (
            <div
              key={card.title}
              className="p-5 border border-gray-200 rounded-lg bg-white hover:border-gray-300 hover:shadow-panel transition-shadow"
            >
              <div className="text-gray-400 mb-3">{card.icon}</div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{card.description}</p>
              <a
                href="#"
                className="text-sm font-medium text-do-blue hover:underline"
              >
                {card.cta}
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
