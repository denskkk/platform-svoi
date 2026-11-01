import { Locale, intlLocales } from './config'

export type PluralForms = { zero?: string; one?: string; two?: string; few?: string; many?: string; other: string }
export type MessageValue = string | PluralForms | Messages
export interface Messages {
  [key: string]: MessageValue
}
export type TranslateVars = Record<string, string | number | null | undefined>
export type Translator = (key: string, vars?: TranslateVars) => string

const PLURAL_KEYS = new Set(['zero', 'one', 'two', 'few', 'many', 'other'])

export function isPluralForms(value: unknown): value is PluralForms {
  if (!value || typeof value !== 'object') return false
  const keys = Object.keys(value as object)
  return keys.length > 0 && keys.includes('other') && keys.every((k) => PLURAL_KEYS.has(k))
}

function lookup(messages: Messages, key: string): MessageValue | undefined {
  let current: MessageValue | undefined = messages
  for (const part of key.split('.')) {
    if (!current || typeof current !== 'object' || isPluralForms(current)) return undefined
    current = (current as Messages)[part]
  }
  return current
}

export function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const value = vars[name]
    return value === undefined || value === null ? match : String(value)
  })
}

function resolveString(locale: Locale, value: MessageValue | undefined, vars?: TranslateVars): string | null {
  if (typeof value === 'string') return interpolate(value, vars)
  if (isPluralForms(value)) {
    const count = Number(vars?.count ?? 0)
    const category = new Intl.PluralRules(intlLocales[locale]).select(count)
    const form = value[category] ?? value.other
    return interpolate(form, vars)
  }
  return null
}

/**
 * Creates a translator. A missing key falls back to the other locale's text and,
 * as a last resort, to the key itself, so the UI never crashes on a gap.
 */
export function createTranslator(locale: Locale, messages: Messages, fallback?: Messages): Translator {
  return (key, vars) => {
    const primary = resolveString(locale, lookup(messages, key), vars)
    if (primary !== null) return primary
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] Missing "${locale}" translation for key "${key}"`)
    }
    if (fallback) {
      const secondary = resolveString(locale, lookup(fallback, key), vars)
      if (secondary !== null) return secondary
    }
    return key
  }
}
