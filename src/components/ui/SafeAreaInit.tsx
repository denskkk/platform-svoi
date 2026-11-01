'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { SafeArea } from 'capacitor-plugin-safe-area'

// iOS WebView is drawn under the status bar and home indicator; expose native insets as CSS variables.
// Android already insets the WebView (adjustMarginsForEdgeToEdge), so applying them there would double the padding.
export function SafeAreaInit() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return

    const apply = (insets: object) => {
      for (const [side, value] of Object.entries(insets) as [string, number][]) {
        document.documentElement.style.setProperty(`--safe-area-inset-${side}`, `${value}px`)
      }
    }

    SafeArea.getSafeAreaInsets().then(({ insets }) => apply(insets)).catch(() => {})
    const listener = SafeArea.addListener('safeAreaChanged', ({ insets }) => apply(insets))

    return () => {
      listener.then((handle) => handle.remove()).catch(() => {})
    }
  }, [])

  return null
}
