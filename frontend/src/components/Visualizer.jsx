import { useEffect, useRef } from 'react'

export default function Visualizer({ chartData }) {
  const chartRef = useRef(null)

  useEffect(() => {
    if (!chartData || !chartRef.current || !window.Plotly) return

    const container = chartRef.current

    const layout = {
      ...chartData.layout,
      autosize: true,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: '#94a3b8', family: 'Inter, sans-serif' },
      margin: { t: 50, r: 30, l: 50, b: 50 },
      legend: {
        font: { color: '#f8fafc', family: 'Inter, sans-serif', size: 12 },
        ...chartData.layout?.legend
      },
      xaxis: {
        ...chartData.layout?.xaxis,
        gridcolor: '#334155',
        zerolinecolor: '#475569'
      },
      yaxis: {
        ...chartData.layout?.yaxis,
        gridcolor: '#334155',
        zerolinecolor: '#475569'
      }
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d']
    }

    window.Plotly.react(container, chartData.data, layout, config)

    const handleResize = () => {
      if (container && window.Plotly) {
        window.Plotly.Plots.resize(container)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [chartData])

  return (
    <div className="w-full h-full flex flex-col pt-2 pb-6 px-2">
      <div ref={chartRef} className="w-full h-full min-h-[350px]" />
    </div>
  )
}
