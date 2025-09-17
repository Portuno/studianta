import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = (e: MediaQueryListEvent) => {
      const newIsMobile = e.matches
      // Only update state if it actually changed to prevent unnecessary re-renders
      setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev)
    }
    
    // Set initial value
    const initialValue = window.innerWidth < MOBILE_BREAKPOINT
    setIsMobile(initialValue)
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
