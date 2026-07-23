import { useState, useRef, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import MainContent from './components/MainContent'
import CopilotPanel from './components/CopilotPanel'

export default function App() {
  const [supportNudgeVisible, setSupportNudgeVisible] = useState(false)
  const copilotPanelRef = useRef(null)

  const onSupportClick = useCallback((e) => {
    e.preventDefault()
    setSupportNudgeVisible(true)
    copilotPanelRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [])

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar onSupportClick={onSupportClick} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 flex min-h-0">
          <MainContent />
          <div ref={copilotPanelRef} className="shrink-0 h-full flex flex-col min-h-0 min-w-0">
            <CopilotPanel
              showAskDocsNudge={supportNudgeVisible}
              onDismissNudge={() => setSupportNudgeVisible(false)}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
