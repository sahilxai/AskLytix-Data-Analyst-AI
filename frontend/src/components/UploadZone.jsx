import { useState } from 'react'
import api from '../api'
import { UploadCloud, FileType, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, Sparkles, Download } from 'lucide-react'

export default function UploadZone({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [error, setError] = useState(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true)
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (selectedFile) => {
    setError(null)
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    
    // Enforce 5MB file size limit (5 * 1024 * 1024 bytes)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024
    if (selectedFile.size > MAX_SIZE_BYTES) {
      setError('File size exceeds the 5MB limit. Please upload a file smaller than 5MB.')
      setFile(null)
      return
    }

    if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
      setFile(selectedFile)
    } else {
      setError('Please upload a valid CSV or Excel file.')
    }
  }

  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      onUploadSuccess(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during upload.')
    } finally {
      setUploading(false)
    }
  }

  const handleLoadDemo = async () => {
    setLoadingDemo(true)
    setError(null)
    try {
      // 1. First try backend direct load endpoint
      const response = await api.post('/api/load-demo')
      onUploadSuccess(response.data)
    } catch (err) {
      // 2. Fallback: fetch Salary.xlsx and upload as FormData
      try {
        const fileRes = await fetch('/Salary.xlsx')
        if (!fileRes.ok) throw new Error("Could not fetch Salary.xlsx asset")
        const blob = await fileRes.blob()
        const demoFile = new File([blob], 'Salary.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const formData = new FormData()
        formData.append('file', demoFile)
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        onUploadSuccess(uploadRes.data)
      } catch (fallbackErr) {
        setError(err.response?.data?.detail || fallbackErr.message || 'Failed to load demo dataset.')
      }
    } finally {
      setLoadingDemo(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div 
        className={`relative group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-300 p-8 text-center ${
          isDragging 
            ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
            : file 
              ? 'border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_30px_-5px_rgba(99,102,241,0.2)]'
              : 'border-slate-700 hover:border-blue-400/50 hover:bg-slate-800/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          id="file-upload" 
          className="hidden" 
          accept=".csv, .xlsx, .xls"
          onChange={handleChange}
          disabled={uploading || loadingDemo}
        />
        
        {file ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-4">
              <FileType size={32} />
            </div>
            <p className="text-slate-200 font-medium text-lg mb-1">{file.name}</p>
            <p className="text-slate-500 text-sm mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Analyze Dataset
                </>
              )}
            </button>
            <button 
              onClick={() => setFile(null)} 
              className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              disabled={uploading}
            >
              Choose a different file
            </button>
          </div>
        ) : (
          <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
            <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors group-hover:scale-110 duration-300">
              <UploadCloud size={32} />
            </div>
            <p className="mb-2 text-lg text-slate-300 font-medium group-hover:text-blue-200 transition-colors">
              <span className="text-blue-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-slate-500 text-sm">CSV or Excel (MAX. 5MB)</p>
          </label>
        )}
      </div>

      {/* Demo Dataset Section */}
      {!file && (
        <div className="mt-6 flex flex-col items-center w-full animate-in fade-in duration-500">
          <div className="flex items-center gap-3 w-full my-2">
            <div className="h-px bg-slate-700/60 flex-1" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Or Explore With Demo Dataset
            </span>
            <div className="h-px bg-slate-700/60 flex-1" />
          </div>

          <div className="w-full mt-3 bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700 hover:border-emerald-500/40 rounded-2xl p-4 transition-all duration-300 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 shadow-lg shadow-slate-900/30 group">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet size={22} />
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-slate-100 font-semibold text-sm sm:text-base truncate">Salary.xlsx</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                    Demo Excel
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5 truncate">
                  Employee Salary dataset (13 records · Salary, Gender, Roles)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
              <a
                href="/Salary.xlsx"
                download="Salary.xlsx"
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
                title="Download Salary.xlsx to your computer"
              >
                <Download size={16} />
              </a>

              <button
                type="button"
                onClick={handleLoadDemo}
                disabled={loadingDemo || uploading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/35 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loadingDemo ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-emerald-200" />
                    <span>Load Demo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
