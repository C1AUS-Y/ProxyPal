import { useEffect, useRef, useState } from 'react'

export default function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0)
  const current = useRef(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = target
      setValue(target)
      return undefined
    }

    const from = current.current
    const start = performance.now()
    let frame

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 4
      current.current = from + (target - from) * eased
      setValue(current.current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}
