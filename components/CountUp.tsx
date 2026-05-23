'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  to: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

export default function CountUp({ to, duration = 1400, prefix = '', suffix = '', decimals = 2 }: CountUpProps) {
  const [value, setValue] = useState(0)
  const start = useRef(Date.now())
  const frame = useRef<number>(0)

  useEffect(() => {
    start.current = Date.now()
    const animate = () => {
      const elapsed = Date.now() - start.current
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(to * ease)
      if (progress < 1) frame.current = requestAnimationFrame(animate)
    }
    frame.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame.current)
  }, [to, duration])

  return (
    <span>
      {prefix}
      {value.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}
