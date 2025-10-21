import React from "react"

export function Progress({ value = 0, className = "" }) {
    const pct = Math.max(0, Math.min(100, Number(value || 0)))
    return (
        <div className={`w-full bg-gray-200 rounded-full h-3 overflow-hidden ${className}`}>
            <div
                style={{ width: `${pct}%` }}
                className="h-full bg-green-500"
            />
        </div>
    )
}