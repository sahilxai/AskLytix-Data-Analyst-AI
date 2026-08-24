import { useState } from 'react'
import api from '../api'
import { UploadCloud, FileType, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function UploadZone({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
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
          disabled={uploading}
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
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-2"
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
              className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors"
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

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
