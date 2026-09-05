import { useEffect, useRef, useState } from 'react'
import { Download, RotateCcw, BarChart3, TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react'

// Premium vibrant color palette for modern analytical dark-mode visualizations
const MODERN_PALETTE = [
  '#38bdf8', // Electric Sky
  '#818cf8', // Vivid Indigo
  '#c084fc', // Bright Purple
  '#34d399', // Mint Emerald
  '#f472b6', // Luminous Rose
  '#fb923c', // Tangerine Amber
  '#2dd4bf', // Neon Teal
  '#a78bfa', // Lavender Violet
  '#fbbf24', // Sunbeam Gold
  '#60a5fa'  // Electric Blue
]

export default function Visualizer({ chartData, visualNumber = 1, title }) {
  const chartRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  // Detect chart category for header badge icon
  const firstTrace = chartData?.data?.[0] || {}
  const traceType = firstTrace.type || 'bar'

  const getChartIcon = () => {
    if (traceType === 'pie') return <PieIcon size={14} className="text-amber-400" />
    if (traceType === 'scatter' || traceType === 'line') return <TrendingUp size={14} className="text-emerald-400" />
    if (traceType === 'box' || traceType === 'histogram') return <Activity size={14} className="text-purple-400" />
    return <BarChart3 size={14} className="text-blue-400" />
  }

  const getChartTypeName = () => {
    if (traceType === 'pie') return firstTrace.hole ? 'Donut Chart' : 'Pie Chart'
    if (traceType === 'bar') return firstTrace.orientation === 'h' ? 'Horizontal Bar' : 'Bar Chart'
    if (traceType === 'scatter' || traceType === 'line') return 'Trend Line'
    if (traceType === 'histogram') return 'Histogram'
    if (traceType === 'box') return 'Box Plot'
    return 'Interactive Visual'
  }

  useEffect(() => {
    if (!chartData || !chartRef.current || !window.Plotly) return

    const container = chartRef.current

    // Deep clone data to avoid in-place mutations
    const rawData = chartData.data || []
    const enhancedData = rawData.map((trace, idx) => {
      const defaultColor = MODERN_PALETTE[idx % MODERN_PALETTE.length]
      const t = { ...trace }

      if (t.type === 'bar') {
        t.marker = {
          color: t.marker?.color || defaultColor,
          line: {
            color: 'rgba(255, 255, 255, 0.25)',
            width: 1.2,
            ...t.marker?.line
          },
          ...t.marker
        }
      } else if (t.type === 'pie') {
        t.hole = t.hole || 0.52
        t.marker = {
          colors: t.marker?.colors || MODERN_PALETTE,
          line: {
            color: '#0f172a',
            width: 2.2,
            ...t.marker?.line
          },
          ...t.marker
        }
        t.textinfo = t.textinfo || 'percent+label'
        t.textposition = t.textposition || 'inside'
        t.insidetextfont = {
          family: 'Inter, system-ui, sans-serif',
          size: 11,
          color: '#ffffff',
          ...t.insidetextfont
        }
      } else if (t.type === 'scatter' || !t.type) {
        if (t.mode?.includes('lines') || !t.mode) {
          t.line = {
            shape: 'spline',
            smoothing: 1.25,
            width: 3.2,
            color: t.line?.color || defaultColor,
            ...t.line
          }
        }
        if (t.mode?.includes('markers')) {
          t.marker = {
            size: 8,
            color: t.marker?.color || defaultColor,
            line: {
              color: '#0f172a',
              width: 2,
              ...t.marker?.line
            },
            ...t.marker
          }
        }
      }

      return t
    })

    const rawTitle = chartData.layout?.title?.text || (typeof chartData.layout?.title === 'string' ? chartData.layout?.title : '') || title || ''
    const cleanTitle = typeof rawTitle === 'string' ? rawTitle.replace(/<[^>]*>?/gm, '').trim() : ''

    const enhancedLayout = {
      ...chartData.layout,
      autosize: true,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: '#94a3b8', family: 'Inter, system-ui, sans-serif', size: 12 },
      margin: { t: cleanTitle ? 50 : 25, r: 30, l: 55, b: 50, ...chartData.layout?.margin },
      title: cleanTitle ? {
        text: cleanTitle,
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 16,
          color: '#f8fafc',
          weight: 700,
          ...chartData.layout?.title?.font
        },
        x: 0.02,
        xanchor: 'left',
        y: 0.98,
        ...chartData.layout?.title
      } : undefined,
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: -0.22,
        xanchor: 'center',
        x: 0.5,
        font: { family: 'Inter, sans-serif', color: '#cbd5e1', size: 11 },
        bgcolor: 'rgba(15, 23, 42, 0.6)',
        bordercolor: 'rgba(51, 65, 85, 0.45)',
        borderwidth: 1,
        ...chartData.layout?.legend
      },
      hoverlabel: {
        bgcolor: 'rgba(15, 23, 42, 0.95)',
        bordercolor: '#38bdf8',
        font: { family: 'Inter, system-ui, sans-serif', size: 12.5, color: '#f8fafc' },
        align: 'left',
        ...chartData.layout?.hoverlabel
      },
      xaxis: {
        ...chartData.layout?.xaxis,
        gridcolor: 'rgba(51, 65, 85, 0.45)',
        zerolinecolor: 'rgba(71, 85, 105, 0.6)',
        linecolor: 'rgba(71, 85, 105, 0.4)',
        tickfont: { family: 'Inter, sans-serif', color: '#94a3b8', size: 11 }
      },
      yaxis: {
        ...chartData.layout?.yaxis,
        gridcolor: 'rgba(51, 65, 85, 0.45)',
        zerolinecolor: 'rgba(71, 85, 105, 0.6)',
        linecolor: 'rgba(71, 85, 105, 0.4)',
        tickfont: { family: 'Inter, sans-serif', color: '#94a3b8', size: 11 }
      }
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: `AskLytix_Visual_${visualNumber}`,
        height: 720,
        width: 1280,
        scale: 2
      }
    }

    window.Plotly.react(container, enhancedData, enhancedLayout, config)

    const handleResize = () => {
      if (container && window.Plotly) {
        window.Plotly.Plots.resize(container)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [chartData, visualNumber, title])

  const handleDownload = async () => {
    if (!chartRef.current || !window.Plotly) return
    setDownloading(true)
    try {
      await window.Plotly.downloadImage(chartRef.current, {
        format: 'png',
        filename: `AskLytix_Visual_${visualNumber}`,
        height: 800,
        width: 1400,
        scale: 2
      })
    } catch (err) {
      console.warn("Download chart error:", err)
    } finally {
      setDownloading(false)
    }
  }

  const handleResetZoom = () => {
    if (!chartRef.current || !window.Plotly) return
    window.Plotly.relayout(chartRef.current, {
      'xaxis.autorange': true,
      'yaxis.autorange': true
    })
  }

  return (
    <div className="w-full h-full flex flex-col pt-1 pb-4 px-2 relative group">
      {/* Top Floating Mini Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 mb-1 bg-slate-900/60 backdrop-blur-sm rounded-lg border border-slate-700/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-bold text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-md border border-blue-500/25">
            #{visualNumber} Visual
          </span>
          <span className="flex items-center gap-1.5 text-slate-300 font-medium pl-1 border-l border-slate-700">
            {getChartIcon()}
            <span>{getChartTypeName()}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetZoom}
            className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-all cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/25 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded font-medium transition-all cursor-pointer"
            title="Download HD PNG"
          >
            <Download size={12} />
            <span className="hidden sm:inline">{downloading ? 'Saving...' : 'Download HD'}</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={chartRef} className="w-full flex-1 min-h-[340px]" />
    </div>
  )
}
