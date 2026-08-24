import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import api from '../api'
import { FileText, Download, X, Loader2 } from 'lucide-react'

export default function ReportGenerator({ currentChart }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)
  const printRef = useRef()

  const handleGenerate = async () => {
    setIsOpen(true)
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.get('/api/generate-insights')
      setReportData(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate AI insights for the report.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    try {
        const content = printRef.current.innerHTML;
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            setError("Pop-up blocker prevented printing. Please allow pop-ups for this site.");
            return;
        }
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Data Analysis Report</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                h1 { font-size: 2.2rem; color: #0f172a; border-bottom: 2px solid #334155; padding-bottom: 10px; margin-bottom: 5px; }
                h2 { font-size: 1.5rem; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 2.5rem; margin-bottom: 15px; }
                p { margin-bottom: 1rem; color: #475569; }
                .bg-slate-50 { background: #f8fafc; padding: 15px; border-radius: 8px; font-style: italic; color: #64748b; margin-top: 15px; border: 1px solid #e2e8f0; }
                ul { padding-left: 20px; color: #334155; margin-bottom: 1rem; }
                li { margin-bottom: 8px; }
                .bg-indigo-50 { background: #eef2ff; padding: 25px; border-radius: 8px; border: 2px solid #c7d2fe; margin-top: 30px; }
                .text-indigo-900 { color: #312e81; font-weight: bold; font-size: 1.25rem; margin-bottom: 10px; }
                .text-indigo-800 { color: #3730a3; font-weight: 500; font-size: 1.1rem; }
                .text-slate-500 { color: #64748b; font-size: 0.9rem; }
                
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 300);
        
    } catch (err) {
        console.error("PDF generation error:", err);
        setError("PDF Generation failed: " + err.message);
    }
  }

  return (
    <>
      <button 
        onClick={handleGenerate}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg"
      >
        <FileText size={18} />
        Generate Report
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md p-4 sm:p-8 flex justify-center items-center">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-4xl max-h-full rounded-2xl shadow-2xl flex flex-col relative shrink-0 overflow-hidden">
            {/* Stationary Header */}
            <div className="z-20 p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800 shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <FileText className="text-indigo-400" /> Executive Summary Report
              </h2>
              <div className="flex items-center gap-4">
                {reportData && (
                  <button 
                    type="button"
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all shadow-md transform hover:scale-105"
                  >
                    <Download size={18} /> Download PDF
                  </button>
                )}
                <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-700 rounded-full hover:bg-slate-600">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8 bg-slate-100 text-slate-800 rounded-b-2xl" ref={printRef}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                  <Loader2 size={48} className="animate-spin text-indigo-500" />
                  <p className="text-lg animate-pulse">AI is reading the full dataset to generate the report...</p>
                </div>
              ) : error ? (
                <div className="text-red-500 font-medium text-center">{error}</div>
              ) : reportData ? (
                <div className="max-w-3xl mx-auto space-y-8 p-4 font-sans bg-white shadow-sm border border-slate-200">
                  <div className="border-b-2 border-slate-800 pb-4 mb-8">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">AskLytix AI Report</h1>
                    <p className="text-slate-500 mt-2">Generated by Automated AI Analysis</p>
                  </div>
                  
                  <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Executive Summary</h2>
                    <p className="text-slate-600 text-lg leading-relaxed">{reportData.summary}</p>
                  </section>
                  
                  {currentChart && (
                    <section className="my-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Visual Insight</h2>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <p className="text-slate-500 italic mb-2">Note: To include the current active visualization exactly as it appears on your dashboard in the PDF, please export it from the chart menu and attach it. The AI has noted the dashboard visualization context.</p>
                      </div>
                    </section>
                  )}

                  <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Key Analytical Insights</h2>
                    <ul className="list-disc pl-6 space-y-3">
                      {reportData.insights?.map((insight, idx) => (
                        <li key={idx} className="text-slate-700 text-lg pl-2 leading-relaxed">{insight}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl mt-8">
                    <h2 className="text-xl font-bold text-indigo-900 mb-3 flex items-center gap-2">
                       Business Recommendation
                    </h2>
                    <p className="text-indigo-800 text-lg font-medium leading-relaxed">{reportData.recommendation}</p>
                  </section>

                </div>
              ) : null}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
