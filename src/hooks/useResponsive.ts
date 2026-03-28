import { useEffect, useState } from 'react'

interface Breakpoints {
  isWide:   boolean  // ≥1200px
  isMedium: boolean  // 900–1199px
  isNarrow: boolean  // <900px
  width: number
}

function getBreakpoints(w: number): Breakpoints {
  return {
    width:    w,
    isWide:   w >= 1200,
    isMedium: w >= 900 && w < 1200,
    isNarrow: w < 900,
  }
}

export function useResponsive(): Breakpoints {
  const [bp, setBp] = useState<Breakpoints>(() =>
    getBreakpoints(typeof window !== 'undefined' ? window.innerWidth : 1200),
  )

  useEffect(() => {
    function onResize() {
      setBp(getBreakpoints(window.innerWidth))
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return bp
}
