export default function DataPreview({ data }) {
  if (!data || !data.preview || data.preview.length === 0) return null

  const columns = data.columns
  const previewRows = data.preview
  const dtypes = data.dtypes || {}

  return (
    <div className="h-full flex flex-col bg-slate-900 overflow-hidden min-w-0">
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-700 shadow-sm">
            <tr>
              <th className="px-3 py-3 font-medium text-slate-400 font-mono text-center w-12 border-r border-slate-700/50 shrink-0">#</th>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-3 font-medium tracking-wider whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-200">{col}</span>
                    <span className="text-[10px] text-blue-400/80 font-mono lowercase">{dtypes[col] || 'str'}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
            {previewRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-800/60 hover:bg-slate-800/60 transition-colors">
                <td className="px-3 py-2 text-slate-500 font-mono text-center border-r border-slate-800/60 shrink-0 select-none bg-slate-900/30">
                  {rowIndex + 1}
                </td>
                {columns.map((col, colIndex) => {
                  let val = row[col]
                  if (typeof val === 'object' && val !== null) {
                    val = JSON.stringify(val)
                  }
                  const isNullOrEmpty = val === null || val === undefined || (typeof val === 'string' && val.trim() === '')
                  const strVal = val !== null && val !== undefined ? String(val) : ''
                  const hasWhitespaceIssue = typeof val === 'string' && (val.startsWith(' ') || val.endsWith(' ')) && val.trim() !== ''

                  return (
                    <td key={colIndex} className="px-4 py-2 whitespace-pre text-slate-300 max-w-[240px] truncate" title={isNullOrEmpty ? 'null' : strVal}>
                      {!isNullOrEmpty ? (
                        hasWhitespaceIssue ? (
                          <span 
                            className="inline-flex items-center gap-1 font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded text-xs whitespace-pre" 
                            title="Uncleaned leading/trailing whitespace detected"
                          >
                            <span className="text-[9px] text-amber-400 font-sans font-semibold border-r border-amber-500/30 pr-1 select-none opacity-80">space</span>
                            <span className="whitespace-pre">{strVal}</span>
                          </span>
                        ) : (
                          <span className="whitespace-pre">{strVal}</span>
                        )
                      ) : (
                        <span className="text-amber-400/90 italic font-mono text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 select-none">null</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-slate-800/70 border-t border-slate-700/70 text-xs text-slate-400 shrink-0 flex items-center justify-between px-4 font-sans">
        <span className="font-medium text-slate-300">
          Showing <span className="text-blue-400 font-semibold">{previewRows.length.toLocaleString()}</span> of <span className="text-blue-400 font-semibold">{data.row_count.toLocaleString()}</span> total records
        </span>
        <span className="text-slate-400 text-[11px] bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700/60 flex items-center gap-1">
          <span>↕ Scroll to inspect all records</span>
        </span>
      </div>
    </div>
  )
}
