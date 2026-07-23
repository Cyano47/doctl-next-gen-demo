import { useState } from 'react'

const projects = [
  { id: 1, name: 'project-name' },
  { id: 2, name: 'project-name' },
  { id: 3, name: 'project-name' },
]

const manageItems = [
  'App Platform',
  'Droplets',
  'Functions',
  'Kubernetes',
  'Volumes Block Storage',
  'Databases',
  'Spaces Object Storage',
  'Container Registry',
  'Images',
  'Networking',
  'Monitoring',
  'Add-Ons',
]

const footerLinks = [
  { label: 'Billing' },
  { label: 'Support' },
  { label: 'Settings' },
  { label: 'API', badge: 'NEW' },
]

function DropletIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  )
}

export default function Sidebar({ onSupportClick }) {
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [manageOpen, setManageOpen] = useState(true)
  const [activeManage, setActiveManage] = useState('Container Registry')

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-[#f8f9fa] border-r border-gray-200">
      {/* Logo */}
      <div className="h-14 flex items-center pl-4 border-b border-gray-200">
        <div className="text-do-blue">
          <DropletIcon className="w-8 h-8" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {/* PROJECTS */}
        <div className="mb-2">
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className="w-full flex items-center justify-between px-4 py-1.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100"
          >
            Projects
            <svg className={`w-4 h-4 transition-transform ${projectsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          {projectsOpen && (
            <div className="mt-0.5">
              {projects.map((p) => (
                <a
                  key={p.id}
                  href="#"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <DropletIcon className="w-4 h-4 text-do-blue shrink-0" />
                  <span>{p.name}</span>
                </a>
              ))}
              <a
                href="#"
                className="flex items-center gap-2 px-4 py-2 text-sm text-do-blue hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </a>
            </div>
          )}
        </div>

        {/* MANAGE */}
        <div>
          <button
            onClick={() => setManageOpen(!manageOpen)}
            className="w-full flex items-center justify-between px-4 py-1.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100"
          >
            Manage
            <svg className={`w-4 h-4 transition-transform ${manageOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          {manageOpen && (
            <div className="mt-0.5">
              {manageItems.map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveManage(item)}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    activeManage === item
                      ? 'bg-gray-200 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 py-2">
        <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          By DigitalOcean
        </div>
        {footerLinks.map(({ label, badge }) =>
          label === 'Support' && onSupportClick ? (
            <button
              key={label}
              type="button"
              onClick={onSupportClick}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 text-left"
            >
              {label}
            </button>
          ) : (
            <a
              key={label}
              href="#"
              className="flex items-center justify-between px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              {label}
              {badge && (
                <span className="text-[10px] font-semibold text-do-blue bg-blue-50 px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              )}
            </a>
          )
        )}
      </div>
    </aside>
  )
}
