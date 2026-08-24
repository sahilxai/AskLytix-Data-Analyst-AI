import { useState, useRef, useEffect } from 'react'
import api from './api'
import UploadZone from './components/UploadZone'
import DataPreview from './components/DataPreview'
import ChatInterface from './components/ChatInterface'
import Visualizer from './components/Visualizer'
import DataCleaningAssistant from './components/DataCleaningAssistant'
import ReportGenerator from './components/ReportGenerator'
import Auth from './components/Auth'
import { supabase } from './supabaseClient'
import { Database, MessageSquare, BarChart2, Bot, Trash2, FileType, ArrowRight, LogOut, Loader2 } from 'lucide-react'

function App() {
  const [datasetContext, setDatasetContext] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [currentChart, setCurrentChart] = useState(null)
  const [activeView, setActiveView] = useState('datasource') // 'datasource' | 'analysis'
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const mainRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoadingSession(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoadingSession(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleUploadSuccess = (data) => {
    setDatasetContext(data)
    setActiveView('analysis')
  }

  const handleChartData = (chartData) => {
    setCurrentChart(chartData)
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleDeleteFile = async () => {
    try {
      await api.delete('/api/delete-data')
    } catch (err) {
      console.warn("Failed to delete backend dataset file:", err)
    }
    setDatasetContext(null)
    setChatHistory([])
    setCurrentChart(null)
    setActiveView('datasource')
  }

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-900 text-blue-400 flex items-center justify-center">
        <Loader2 size={36} className="animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="flex flex-col md:flex-row h-screen min-h-[100dvh] bg-slate-900 text-slate-100 overflow-x-hidden overflow-y-auto md:overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-800 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col justify-between shrink-0">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between md:justify-start gap-2 mb-3 md:mb-8 text-blue-400">
            <div className="flex items-center gap-2">
              <Bot size={24} strokeWidth={2} />
              <h1 className="text-xl font-bold tracking-tight text-white">AskLytix</h1>
            </div>
            {/* Mobile Logout button */}
            <button
              onClick={() => supabase.auth.signOut()}
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-900/60 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0">
            <div
              onClick={() => setActiveView('datasource')}
              className={`flex items-center gap-2.5 md:gap-3 px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg cursor-pointer transition-all shrink-0 text-sm md:text-base ${activeView === 'datasource' ? 'bg-blue-600/20 text-blue-400 font-medium' : 'hover:bg-slate-700 text-slate-300'}`}
            >
              <Database size={18} />
              <span className="font-medium whitespace-nowrap">Data Source</span>
            </div>
            <div
              onClick={() => datasetContext && setActiveView('analysis')}
              className={`flex items-center gap-2.5 md:gap-3 px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg transition-all shrink-0 text-sm md:text-base ${datasetContext
                  ? activeView === 'analysis'
                    ? 'bg-blue-600/20 text-blue-400 cursor-pointer font-medium'
                    : 'hover:bg-slate-700 text-slate-300 cursor-pointer'
                  : 'text-slate-500 cursor-not-allowed opacity-50'
                }`}
            >
              <MessageSquare size={18} />
              <span className="font-medium whitespace-nowrap">Analysis Chat</span>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="hidden md:block p-4 border-t border-slate-700/60 bg-slate-800/80 text-xs">
          <div className="flex items-center justify-center gap-2 flex-wrap text-slate-300 font-medium">
            <span className="text-slate-200 font-semibold">Sahil Bhirud</span>
            <span className="text-slate-600">|</span>
            <a
              href="https://github.com/sahilxai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-white transition-colors group cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>
            <span className="text-slate-600">|</span>
            <a
              href="https://www.linkedin.com/in/sahilbhirud2005/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-blue-400 transition-colors group cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9z" />
              </svg>
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto relative min-w-0">
        <header className="h-auto py-3 px-4 md:px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
          <h2 className="text-sm md:text-lg font-semibold text-slate-200 truncate max-w-[280px] sm:max-w-md">
            {datasetContext ? `Dataset: ${datasetContext.filename} (${datasetContext.row_count} rows)` : 'Connect Data Source'}
          </h2>
          <div className="flex items-center gap-3">
            {datasetContext && activeView === 'analysis' && <ReportGenerator currentChart={currentChart} />}
            <button
              onClick={() => supabase.auth.signOut()}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-800/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-lg transition-all cursor-pointer shadow-sm"
              title="Logout of Asklytix"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">

          {/* DATA SOURCE VIEW */}
          {activeView === 'datasource' && (
            <div className="min-h-full flex flex-col items-center justify-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 py-4">
              <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10">
                <Database size={32} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                {datasetContext ? 'Manage Data Source' : 'Start Your Analysis'}
              </h2>
              <p className="text-slate-400 text-center mb-8 text-sm sm:text-base md:text-lg">
                {datasetContext
                  ? 'Your dataset is loaded. Delete it to start fresh, or upload a new file to replace it.'
                  : 'Upload a CSV or Excel file to let the AI analyze, visualize, and extract insights from your data instantly.'}
              </p>

              {/* Current file card */}
              {datasetContext && (
                <div className="w-full max-w-xl mb-6 bg-slate-800/60 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 shadow-lg shadow-indigo-500/10">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                      <FileType size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-200 font-semibold truncate text-sm sm:text-base">{datasetContext.filename}</p>
                      <p className="text-slate-500 text-xs sm:text-sm">{datasetContext.row_count} rows · {datasetContext.columns?.length} columns</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveView('analysis')}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-all font-medium"
                    >
                      Analyse <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={handleDeleteFile}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg transition-all font-medium border border-red-500/20 hover:border-red-500/50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Upload zone always visible — uploading a new file replaces the old one */}
              <UploadZone onUploadSuccess={handleUploadSuccess} />
            </div>
          )}

          {/* ANALYSIS VIEW */}
          {activeView === 'analysis' && datasetContext && (
            <div className="flex flex-col xl:flex-row gap-6 md:gap-8 animate-in fade-in duration-500 pb-12 w-full max-w-[1600px] mx-auto">

              {/* Left Column */}
              <div className="flex-1 flex flex-col gap-6 md:gap-8 min-w-0">

                {/* Visualizer */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 sm:p-6 shadow-xl shadow-slate-900/40 flex flex-col h-[450px] sm:h-[600px] relative transition-all duration-300 hover:border-blue-500/30 group">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-medium flex items-center gap-2">
                      <BarChart2 size={24} className="text-blue-400" />
                      Visualization Canvas
                    </h3>
                  </div>
                  <div className="flex-1 flex items-center justify-center bg-slate-900/60 rounded-xl border border-slate-700/30 overflow-hidden relative shadow-inner">
                    {currentChart ? (
                      <Visualizer chartData={currentChart} />
                    ) : (
                      <div className="text-slate-500 flex flex-col items-center gap-4 text-center px-6 max-w-sm">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 flex items-center justify-center shadow-lg border border-slate-700">
                          <BarChart2 size={32} className="text-slate-600" />
                        </div>
                        <h4 className="text-slate-300 font-medium text-base sm:text-lg">Empty Canvas</h4>
                        <p className="text-xs sm:text-sm">Ask Gemini to generate a chart. It will be rendered beautifully in this space.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data Cleaning & Reference */}
                <div className="flex flex-col gap-6 md:gap-8 min-w-0">
                  <DataCleaningAssistant datasetContext={datasetContext} setDatasetContext={setDatasetContext} />

                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 sm:p-6 shadow-xl shadow-slate-900/40 flex flex-col h-[450px] sm:h-[520px] min-w-0">
                    <h3 className="text-base sm:text-lg font-medium mb-4 flex items-center gap-2 text-slate-300 tracking-wider">
                      <Database size={20} className="text-indigo-400" />
                      Dataset Reference
                    </h3>
                    <div className="flex-1 overflow-hidden rounded-xl border border-slate-700/30 bg-slate-900/50 min-w-0">
                      <DataPreview data={datasetContext} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Chat */}
              <div className="w-full xl:w-[450px] shrink-0">
                <div className="h-[550px] xl:sticky xl:top-0 xl:h-[calc(100vh-8rem)] bg-slate-800 border border-slate-700/60 rounded-2xl shadow-xl flex flex-col overflow-hidden relative group">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />
                  <ChatInterface
                    chatHistory={chatHistory}
                    setChatHistory={setChatHistory}
                    onChartGenerated={handleChartData}
                  />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

export default App
