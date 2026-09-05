import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import api from '../api'
import { FileText, Download, X, Loader2, BarChart2 } from 'lucide-react'

export default function ReportGenerator({ currentChart, generatedCharts = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)
  const [processedVisuals, setProcessedVisuals] = useState([])
  const printRef = useRef()

  const captureChartImage = async (chartData) => {
    if (!window.Plotly || !chartData || !chartData.data) return null
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'fixed'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '-9999px'
    tempDiv.style.width = '780px'
    tempDiv.style.height = '420px'
    tempDiv.style.opacity = '0'
    tempDiv.style.pointerEvents = 'none'
    document.body.appendChild(tempDiv)

    try {
      const cloned = JSON.parse(JSON.stringify(chartData))
      const cleanLayout = {
        ...cloned.layout,
        autosize: false,
        width: 780,
        height: 420,
        paper_bgcolor: '#ffffff',
        plot_bgcolor: '#f8fafc',
        font: { color: '#1e293b', family: 'system-ui, -apple-system, sans-serif', size: 12 },
        margin: { t: 55, r: 35, l: 55, b: 55 },
        title: cloned.layout?.title ? {
          ...cloned.layout.title,
          font: { color: '#0f172a', size: 15, family: 'system-ui, sans-serif' }
        } : undefined,
        xaxis: {
          ...cloned.layout?.xaxis,
          gridcolor: '#e2e8f0',
          zerolinecolor: '#cbd5e1',
          tickfont: { color: '#475569', size: 10 }
        },
        yaxis: {
          ...cloned.layout?.yaxis,
          gridcolor: '#e2e8f0',
          zerolinecolor: '#cbd5e1',
          tickfont: { color: '#475569', size: 10 }
        }
      }

      await window.Plotly.newPlot(tempDiv, cloned.data, cleanLayout, { displayModeBar: false, responsive: false })
      const imgUrl = await window.Plotly.toImage(tempDiv, { format: 'png', width: 780, height: 420 })
      return imgUrl
    } catch (e) {
      console.warn("Error rendering chart image for report:", e)
      return null
    } finally {
      try {
        window.Plotly.purge(tempDiv)
      } catch (e) {}
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv)
      }
    }
  }

  const getCleanVisualSummary = (visual, index) => {
    if (visual.summary && typeof visual.summary === 'string' && visual.summary.trim()) {
      let text = visual.summary
        .replace(/```[\s\S]*?```/g, '')
        .replace(/^#+\s+/gm, '')
        .replace(/[*_`]/g, '')
        .replace(/\n+/g, ' ')
        .trim()
      if (text.length > 20) {
        const match = text.match(/^(.*?[.?!])\s*(.*?[.?!])?(\s*.*?[.?!])?/)
        if (match) {
          const sentences = [match[1], match[2], match[3]].filter(Boolean).join(' ')
          if (sentences.length <= 320) return sentences
        }
        return text.slice(0, 280) + (text.length > 280 ? '...' : '')
      }
    }
    
    if (visual.title) {
      return `Analytical visual breakdown for ${visual.title}, highlighting core distributions, category rankings, and key metric variations observed in the dataset.`
    }
    return `Interactive visual representation summarizing category proportions and trends.`
  }

  const handleGenerate = async () => {
    setIsOpen(true)
    setIsLoading(true)
    setError(null)
    
    // Compile visuals list from generatedCharts or currentChart
    const listToProcess = (generatedCharts && generatedCharts.length > 0)
      ? generatedCharts
      : (currentChart ? [{
          id: 1,
          chartData: currentChart,
          title: currentChart.layout?.title?.text || (typeof currentChart.layout?.title === 'string' ? currentChart.layout?.title : 'Generated Visualization'),
          summary: 'Interactive data visualization generated from user query analysis.',
          query: 'Data visualization'
        }] : [])

    try {
      // Process visual images and insights concurrently
      const [insightsResponse, capturedList] = await Promise.all([
        api.get('/api/generate-insights'),
        Promise.all(
          listToProcess.map(async (v, idx) => {
            const img = await captureChartImage(v.chartData)
            return {
              ...v,
              index: idx + 1,
              imageUrl: img,
              displaySummary: getCleanVisualSummary(v, idx)
            }
          })
        )
      ])

      setReportData(insightsResponse.data)
      setProcessedVisuals(capturedList)
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate AI insights for the report.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = () => {
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
            <title>AskLytix Data Analysis Report</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 35px; color: #1e293b; line-height: 1.5; max-width: 840px; margin: 0 auto; background: #ffffff; }
              h1 { font-size: 2.2rem; color: #0f172a; border-bottom: 2px solid #334155; padding-bottom: 10px; margin-bottom: 5px; font-weight: 800; }
              h2 { font-size: 1.4rem; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 2rem; margin-bottom: 12px; font-weight: 700; }
              p { margin-bottom: 0.75rem; color: #475569; font-size: 0.95rem; }
              .bg-slate-50 { background: #f8fafc; padding: 16px; border-radius: 10px; color: #334155; margin-top: 15px; border: 1px solid #e2e8f0; }
              ul { padding-left: 20px; color: #334155; margin-bottom: 1rem; }
              li { margin-bottom: 6px; font-size: 0.95rem; }
              .bg-indigo-50 { background: #eef2ff; padding: 20px; border-radius: 10px; border: 1.5px solid #c7d2fe; margin-top: 24px; }
              .text-indigo-900 { color: #312e81; font-weight: bold; font-size: 1.15rem; margin-bottom: 8px; }
              .text-indigo-800 { color: #3730a3; font-weight: 500; font-size: 1rem; }
              .text-slate-500 { color: #64748b; font-size: 0.85rem; }
              img { max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 8px; }
              .chart-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; page-break-inside: avoid; }
              .chart-badge { display: inline-block; background: #4f46e5; color: white; font-weight: bold; font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; margin-right: 8px; }
              .chart-summary-box { background: #f8fafc; border-left: 4px solid #6366f1; padding: 10px 14px; border-radius: 0 8px 8px 0; margin-top: 12px; }
              .chart-summary-title { font-weight: bold; font-size: 0.75rem; color: #3730a3; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em; }
              .chart-summary-text { color: #334155; font-size: 0.9rem; line-height: 1.5; margin: 0; }
              
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .chart-card { page-break-inside: avoid; }
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
      }, 400);
      
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("PDF Generation failed: " + err.message);
    }
  }

  return (
    <>
      <button 
        onClick={handleGenerate}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg cursor-pointer"
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
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all shadow-md transform hover:scale-105 cursor-pointer"
                  >
                    <Download size={18} /> Download PDF
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-700 rounded-full hover:bg-slate-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8 bg-slate-100 text-slate-800 rounded-b-2xl" ref={printRef}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 py-16">
                  <Loader2 size={48} className="animate-spin text-indigo-500" />
                  <p className="text-lg animate-pulse font-medium">AI is compiling full dataset insights and rendering visual charts...</p>
                </div>
              ) : error ? (
                <div className="text-red-500 font-medium text-center py-12">{error}</div>
              ) : reportData ? (
                <div className="max-w-3xl mx-auto space-y-8 p-4 font-sans bg-white shadow-sm border border-slate-200 rounded-xl">
                  <div className="border-b-2 border-slate-800 pb-4 mb-8">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">AskLytix AI Report</h1>
                    <p className="text-slate-500 mt-2 font-medium">Automated Analytical Intelligence & Visual Summary</p>
                  </div>
                  
                  {/* Executive Summary */}
                  <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Executive Summary</h2>
                    <p className="text-slate-600 text-base sm:text-lg leading-relaxed">{reportData.summary}</p>
                  </section>
                  
                  {/* All Generated Visuals with Proper Short Summaries */}
                  {processedVisuals.length > 0 && (
                    <section className="my-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-5 border-b border-slate-200 pb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <BarChart2 className="text-indigo-600" size={22} />
                          Visual Analytics & Insights ({processedVisuals.length})
                        </span>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                          Included in PDF
                        </span>
                      </h2>

                      <div className="space-y-6">
                        {processedVisuals.map((visual, idx) => {
                          const ordinal = idx === 0 ? '1st' : idx === 1 ? '2nd' : idx === 2 ? '3rd' : `${idx + 1}th`
                          return (
                            <div key={visual.id || idx} className="chart-card bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                              {/* Visual Header */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="chart-badge px-2.5 py-1 bg-indigo-600 text-white font-bold text-xs rounded-md shadow-sm">
                                    #{idx + 1} Visual
                                  </span>
                                  <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                                    {visual.title}
                                  </h3>
                                </div>
                                {visual.query && (
                                  <span className="text-xs text-slate-500 italic max-w-md truncate">
                                    Query: "{visual.query}"
                                  </span>
                                )}
                              </div>

                              {/* Visual Chart Image */}
                              <div className="flex justify-center bg-slate-50/50 rounded-lg border border-slate-100 p-2 overflow-hidden">
                                {visual.imageUrl ? (
                                  <img
                                    src={visual.imageUrl}
                                    alt={visual.title}
                                    className="max-w-full h-auto object-contain rounded-md"
                                    style={{ maxHeight: '380px' }}
                                  />
                                ) : (
                                  <div className="p-8 text-center text-slate-400 text-sm italic">
                                    Visual chart rendered in dashboard
                                  </div>
                                )}
                              </div>

                              {/* Proper Short Summary on Visual */}
                              <div className="chart-summary-box bg-slate-50/80 border-l-4 border-indigo-500 p-3.5 rounded-r-lg">
                                <div className="chart-summary-title text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">
                                  Visual Summary & Key Observation:
                                </div>
                                <p className="chart-summary-text text-slate-700 text-sm leading-relaxed">
                                  {visual.displaySummary || getCleanVisualSummary(visual, idx)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {/* Key Analytical Insights */}
                  <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Key Analytical Insights</h2>
                    <ul className="list-disc pl-6 space-y-3">
                      {reportData.insights?.map((insight, idx) => (
                        <li key={idx} className="text-slate-700 text-base sm:text-lg pl-2 leading-relaxed">{insight}</li>
                      ))}
                    </ul>
                  </section>

                  {/* Business Recommendation */}
                  <section className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl mt-8">
                    <h2 className="text-xl font-bold text-indigo-900 mb-3 flex items-center gap-2">
                       Business Recommendation
                    </h2>
                    <p className="text-indigo-800 text-base sm:text-lg font-medium leading-relaxed">{reportData.recommendation}</p>
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
