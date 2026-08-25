import React from 'react'

export default function Logo({ className = "w-6 h-6", showBackground = false }) {
  if (showBackground) {
    return (
      <div className="w-12 h-12 bg-slate-900 border border-blue-500/30 rounded-xl p-1.5 flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0">
        <svg viewBox="0 0 512 512" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="105" y="295" width="55" height="110" rx="16" fill="#a855f7"/>
          <rect x="185" y="235" width="55" height="170" rx="16" fill="#3b82f6"/>
          <rect x="265" y="165" width="55" height="240" rx="16" fill="#06b6d4"/>
          <rect x="345" y="195" width="55" height="210" rx="16" fill="#38bdf8"/>
          <path d="M 372.5 70 Q 372.5 120 422.5 120 Q 372.5 120 372.5 170 Q 372.5 120 322.5 120 Q 372.5 120 372.5 70 Z" fill="#ffffff"/>
          <circle cx="372.5" cy="120" r="10" fill="#38bdf8"/>
        </svg>
      </div>
    )
  }

  return (
    <svg viewBox="0 0 512 512" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="105" y="295" width="55" height="110" rx="16" fill="#a855f7"/>
      <rect x="185" y="235" width="55" height="170" rx="16" fill="#3b82f6"/>
      <rect x="265" y="165" width="55" height="240" rx="16" fill="#06b6d4"/>
      <rect x="345" y="195" width="55" height="210" rx="16" fill="#38bdf8"/>
      <path d="M 372.5 70 Q 372.5 120 422.5 120 Q 372.5 120 372.5 170 Q 372.5 120 322.5 120 Q 372.5 120 372.5 70 Z" fill="#ffffff"/>
      <circle cx="372.5" cy="120" r="10" fill="#38bdf8"/>
    </svg>
  )
}
