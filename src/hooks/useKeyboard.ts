import { useEffect, useRef } from 'react'

type KeyHandlers = Partial<Record<string, (e: KeyboardEvent) => void>>

export function useKeyboard(handlers: KeyHandlers, disabled = false) {
  const handlersRef = useRef<KeyHandlers>(handlers)
  handlersRef.current = handlers // always current without re-registering

  useEffect(() => {
    if (disabled) return

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

      const handler = handlersRef.current[e.key]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled])
}
