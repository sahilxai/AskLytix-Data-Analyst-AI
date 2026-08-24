import { useState, useEffect } from 'react'
import api from '../api'
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Download } from 'lucide-react'

export default function DataCleaningAssistant({ datasetContext, setDatasetContext }) {
  const [healthStatus, setHealthStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (datasetContext) {
      checkHealth()
    }
  }, [datasetContext])

  const checkHealth = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/data-health')
      setHealthStatus(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to check data health.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanData = async () => {
    setIsCleaning(true)
    setError(null)
    try {
      const response = await api.post('/api/clean-data', { action: "auto" })
      // response.data contains the new dataset context
      setHealthStatus(null) // Reset health status to force recheck or signal we're clean
      setDatasetContext({
        columns: response.data.columns,
        dtypes: response.data.dtypes,
        preview: response.data.preview,
        filename: response.data.filename,
        row_count: response.data.row_count
      })
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to clean data.")
    } finally {
      setIsCleaning(false)
    }
  }

  const handleDownloadData = async () => {
    try {
      const response = await api.get('/api/download-data', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', datasetContext?.filename || 'cleaned_data.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to download data.")
    }
  }

  if (!datasetContext) return null

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-slate-900/40 flex flex-col h-[340px]">
      <h3 className="text-lg font-medium mb-4 flex items-center justify-between text-slate-300 tracking-wider">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-emerald-400" />
          Data Health & Cleaning
        </div>
        {healthStatus && (
          <span className={`text-xs px-2 py-1 rounded-full font-bold ${healthStatus.health_score === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            Score: {healthStatus.health_score}/100
          </span>
        )}
      </h3>

      <div className="flex-1 overflow-auto rounded-xl border border-slate-700/30 bg-slate-900/50 p-4 mb-4 relative custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            <RefreshCw className="animate-spin mr-2" size={16} /> Checking health...
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : healthStatus ? (
          <div className="space-y-3">
            {healthStatus.health_score === 100 ? (
              <div className="flex flex-col items-center justify-center h-full text-emerald-400 gap-2 mt-4">
                <CheckCircle2 size={32} />
                <p className="font-medium">Data looks perfectly clean!</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {healthStatus.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                    <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="text-slate-500 text-sm text-center mt-6">Health data unavailable.</div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleCleanData}
          disabled={isCleaning || isLoading || healthStatus?.health_score === 100}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
        >
          {isCleaning ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
          {isCleaning ? 'Cleaning Data...' : 'Auto-Clean Data'}
        </button>

        <button
          type="button"
          onClick={handleDownloadData}
          className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 hover:border-emerald-400/70 text-emerald-400 text-sm font-medium rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download size={16} />
          Download
        </button>
      </div>
    </div>
  )
}
