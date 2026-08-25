import React from 'react'

export default function Logo({ className = "w-6 h-6", showBackground = false }) {
  if (showBackground) {
    return (
      <img
        src="/logo.png"
        alt="AskLytix Logo"
        className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-cyan-500/20 border border-cyan-500/30 shrink-0"
      />
    )
  }

  return (
    <img
      src="/logo.png"
      alt="AskLytix Logo"
      className={`${className} rounded-lg object-cover shadow-md shadow-cyan-500/20 shrink-0`}
    />
  )
}
