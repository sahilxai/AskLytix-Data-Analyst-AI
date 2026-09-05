import { useState, useRef, useEffect } from 'react'
import api from '../api'
import { Send, Loader2, Bot, User, Code, FileCode2, Sparkles, BarChart2, BarChartHorizontal, PieChart, LineChart, AreaChart, ScatterChart, Activity, Grid, ArrowRight, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function ChatInterface({ chatHistory, setChatHistory, onChartGenerated }) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
  const chatContainerRef = useRef(null)

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  useEffect(() => {
    // Auto-fetch visualization suggestions on load
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const response = await api.get('/api/suggest-visualizations')
      if (response.data && response.data.suggestions) {
        setSuggestions(response.data.suggestions)
      }
    } catch (err) {
      console.warn("Failed to load visualization suggestions:", err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleSuggestClick = () => {
    setShowSuggestionsModal(prev => !prev)
    if (suggestions.length === 0) {
      fetchSuggestions()
    }
  }

  const handleSelectSuggestion = (promptText) => {
    if (isLoading) return
    setShowSuggestionsModal(false)
    triggerChat(promptText)
  }

  const triggerChat = async (messageText) => {
    if (!messageText.trim() || isLoading) return

    const userMessage = messageText.trim()
    setInput('')
    
    // Add user message to history
    const newUserMsg = { role: 'user', content: userMessage }
    setChatHistory(prev => [...prev, newUserMsg])
    
    setIsLoading(true)

    try {
      // Send to backend with 120s timeout
      const response = await api.post('/api/chat', {
        message: userMessage,
        history: chatHistory
      }, { timeout: 120000 })

      const data = response.data

      const rawContent = (data.result && data.result.trim() && data.result.trim().toLowerCase() !== 'none' && data.result.trim().toLowerCase() !== 'null')
        ? data.result.trim()
        : (data.suggestion && data.suggestion.trim() && data.suggestion.trim().toLowerCase() !== 'none' ? data.suggestion.trim() : "Done! Interactive visualization generated successfully.")

      const newAssistantMsg = { 
        role: 'assistant', 
        content: rawContent,
        suggestion: data.suggestion,
        plan: data.plan,
        code: data.code,
        error: data.error
      }
      
      setChatHistory(prev => [...prev, newAssistantMsg])
      
      if (data.chart) {
        onChartGenerated(data.chart, {
          query: userMessage,
          summary: rawContent,
          suggestion: data.suggestion,
          title: data.chart.layout?.title?.text || (typeof data.chart.layout?.title === 'string' ? data.chart.layout?.title : '') || userMessage
        })
      }
    } catch (error) {
      let errorMsg = error.response?.data?.detail || error.message
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        errorMsg = 'Request timed out or backend disconnected. Please try again.'
      }
      setChatHistory(prev => [...prev, { 
        role: 'system', 
        content: `Error: ${errorMsg}` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    triggerChat(input)
  }

  const getSuggestionIcon = (suggestion) => {
    const chartType = (suggestion?.chart_type || '').toLowerCase().trim()
    const text = `${suggestion?.title || ''} ${suggestion?.prompt || ''}`.toLowerCase()

    // 1. Pie / Donut
    if (chartType.includes('pie') || chartType.includes('donut') || text.includes('pie') || text.includes('donut') || text.includes('proportion') || text.includes('percentage share') || text.includes('share of') || text.includes('composition')) {
      return <PieChart size={16} className="text-amber-400" />
    }

    // 2. Horizontal Bar Chart (Must check before general bar)
    if (chartType.includes('horizontal') || text.includes('horizontal bar') || text.includes('horizontal-bar') || text.includes('horizontal column') || (text.includes('horizontal') && text.includes('bar'))) {
      return <BarChartHorizontal size={16} className="text-emerald-400" />
    }

    // 3. Line / Trend / Time Series
    if (chartType.includes('line') || chartType.includes('trend') || text.includes('line chart') || text.includes('trend') || text.includes('over time') || text.includes('timeline') || text.includes('timeseries') || text.includes('time series') || text.includes('progression')) {
      return <LineChart size={16} className="text-cyan-400" />
    }

    // 4. Area Chart
    if (chartType.includes('area') || text.includes('area chart') || text.includes('cumulative')) {
      return <AreaChart size={16} className="text-teal-400" />
    }

    // 5. Scatter / Correlation / Bubble
    if (chartType.includes('scatter') || chartType.includes('bubble') || text.includes('scatter') || text.includes('correlation') || text.includes('relationship between') || text.includes(' vs ') || text.includes('bubble')) {
      return <ScatterChart size={16} className="text-purple-400" />
    }

    // 6. Heatmap / Matrix / Correlation Matrix
    if (chartType.includes('heatmap') || chartType.includes('matrix') || text.includes('heatmap') || text.includes('correlation matrix') || text.includes('grid')) {
      return <Grid size={16} className="text-rose-400" />
    }

    // 7. Box / Distribution / Histogram
    if (chartType.includes('histogram') || chartType.includes('box') || chartType.includes('distribution') || text.includes('histogram') || text.includes('box plot') || text.includes('distribution') || text.includes('spread') || text.includes('variance') || text.includes('frequency')) {
      return <Activity size={16} className="text-violet-400" />
    }

    // 8. Standard Bar / Column Chart
    if (chartType.includes('bar') || chartType.includes('column') || text.includes('bar chart') || text.includes('column') || text.includes('count of') || text.includes('ranking') || text.includes('breakdown')) {
      return <BarChart2 size={16} className="text-blue-400" />
    }

    // Default fallback
    return <Sparkles size={16} className="text-indigo-400" />
  }

  return (
    <div className="relative flex flex-col h-full bg-slate-900 overflow-hidden text-slate-200 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md z-10">
        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
          <Bot size={18} className="text-blue-400" />
          Data Analyst AI
        </h3>
        <button
          onClick={handleSuggestClick}
          disabled={loadingSuggestions}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 hover:from-blue-600/40 hover:to-purple-600/40 text-blue-300 border border-blue-500/30 hover:border-blue-400/60 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
          title="Analyze dataset and suggest best visualization prompts"
        >
          {loadingSuggestions ? (
            <Loader2 size={13} className="animate-spin text-blue-400" />
          ) : (
            <Sparkles size={13} className="text-amber-400" />
          )}
          <span>Suggest Visuals</span>
        </button>
      </div>
      
      {/* Suggestions Overlay Modal */}
      {showSuggestionsModal && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex flex-col p-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-sm">
                <Sparkles size={16} className="text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Visualization Suggestions</h4>
                <p className="text-[11px] text-slate-400">Tailored to your dataset</p>
              </div>
            </div>
            <button
              onClick={() => setShowSuggestionsModal(false)}
              className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Close suggestions panel"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar">
            {loadingSuggestions ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-blue-400" />
                <span className="text-xs animate-pulse">Analyzing dataset schema for smart suggestions...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {suggestions.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    onClick={() => handleSelectSuggestion(s.prompt)}
                    className="group p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 rounded-xl transition-all cursor-pointer shadow-md flex items-start gap-3 relative overflow-hidden"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800/90 text-blue-400 flex items-center justify-center shrink-0 border border-slate-700/80 group-hover:scale-110 transition-transform shadow-inner">
                      {getSuggestionIcon(s)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-blue-300 transition-colors">
                          {idx + 1}. {s.title}
                        </span>
                        <ArrowRight size={13} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-xs text-slate-400 font-light leading-relaxed group-hover:text-slate-300 transition-colors">
                        "{s.prompt}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 py-8">
                No suggestions available. Try re-uploading your dataset.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages & Suggestions Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatHistory.length === 0 && (
          <div className="flex flex-col gap-4 my-2">
            <div className="text-center py-2">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-500/20 shadow-md">
                <Sparkles size={24} className="text-blue-400" />
              </div>
              <h4 className="text-base font-bold text-slate-200">Recommended Visualizations</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                Analyzed from your dataset. Click any suggestion below to generate an interactive chart.
              </p>
            </div>

            {/* Suggestions Cards */}
            {loadingSuggestions ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-500 gap-2">
                <Loader2 size={24} className="animate-spin text-blue-400" />
                <span className="text-xs animate-pulse">Analyzing dataset schema for smart suggestions...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {suggestions.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    onClick={() => handleSelectSuggestion(s.prompt)}
                    className="group p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 rounded-xl transition-all cursor-pointer shadow-md flex items-start gap-3 relative overflow-hidden"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800/90 text-blue-400 flex items-center justify-center shrink-0 border border-slate-700/80 group-hover:scale-110 transition-transform shadow-inner">
                      {getSuggestionIcon(s)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-blue-300 transition-colors">
                          {idx + 1}. {s.title}
                        </span>
                        <ArrowRight size={13} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-xs text-slate-400 font-light leading-relaxed group-hover:text-slate-300 transition-colors">
                        "{s.prompt}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 py-4">
                Ask any data question or click "Suggest Visuals" above.
              </div>
            )}
          </div>
        )}
        
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 min-w-0 max-w-full overflow-x-hidden ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'
            }`}>
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-blue-400" />}
            </div>
            
            {/* Message Bubble */}
            <div className={`flex flex-col max-w-[85%] min-w-0 gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-3 rounded-2xl shadow-sm min-w-0 break-words overflow-x-hidden ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 border border-slate-700 rounded-tl-none text-slate-200'
              }`}>
                {msg.role === 'system' ? (
                  <div className="text-red-400 font-mono text-xs break-words">{msg.content}</div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-full break-words overflow-x-hidden prose-p:leading-relaxed prose-pre:whitespace-pre-wrap prose-pre:break-all">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              
              {/* Optional Code & Plan Metadata for Assistant */}
              {msg.role === 'assistant' && (msg.plan || msg.code) && (
                <div className="flex flex-col gap-2 w-full mt-1 min-w-0 max-w-full">
                  {msg.plan && (
                    <details className="bg-slate-800/80 border border-slate-700 rounded-lg overflow-hidden group">
                      <summary className="px-3 py-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors flex items-center gap-2">
                        <FileCode2 size={14} /> Plan of Action
                      </summary>
                      <div className="p-3 text-xs font-mono text-slate-300 bg-slate-900 border-t border-slate-700 whitespace-pre-wrap break-words">
                        {msg.plan}
                      </div>
                    </details>
                  )}
                  {msg.code && (
                    <details className="bg-slate-800/80 border border-slate-700 rounded-lg overflow-hidden group min-w-0 max-w-full">
                      <summary className="px-3 py-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors flex items-center gap-2">
                        <Code size={14} /> Executed Python Code
                      </summary>
                      <div className="p-3 text-xs font-mono text-blue-300 bg-[#0d1117] border-t border-slate-700 overflow-x-auto max-w-full">
                        <pre className="whitespace-pre-wrap break-all max-w-full"><code>{msg.code}</code></pre>
                      </div>
                    </details>
                  )}
                  {msg.error && (
                    <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-mono overflow-x-auto whitespace-pre-wrap break-all">
                      {msg.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 animate-in fade-in">
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shadow-md">
                <Bot size={16} className="text-blue-400" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-400" />
              <span className="text-slate-400 text-xs font-medium animate-pulse">Analyzing data and generating high-end visualization...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 z-10 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or select a suggested visual above..."
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner placeholder:text-slate-500 placeholder:font-light"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-md flex items-center justify-center shrink-0 disabled:cursor-not-allowed group-focus-within:bg-blue-500"
          >
            <Send size={16} className={input.trim() ? 'translate-x-[1px] -translate-y-[1px]' : ''} />
          </button>
        </form>
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[10px] text-slate-500 font-medium">PowerBI / Tableau level Plotly Visualizations</span>
          {suggestions.length > 0 && chatHistory.length > 0 && (
            <button
              onClick={handleSuggestClick}
              className="text-[10px] text-blue-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <Sparkles size={10} /> View Visual Suggestions
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
