#!/usr/bin/env node
/**
 * Translation completeness check.
 *
 *  - messages/uk and messages/en must have identical key sets (plural objects count as one leaf)
 *  - every {placeholder} must exist in both languages
 *  - no empty values; no Cyrillic in English values
 *  - every literal t('ns.key') used in src/ must exist
 *  - hard-coded Cyrillic in src/ (outside comments) is reported; use --strict-source to fail on it
 *
 * Usage: node scripts/check-i18n.mjs [--strict-source] [--warn-unused]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const messagesDir = path.join(root, 'messages')
const srcDir = path.join(root, 'src')
const args = new Set(process.argv.slice(2))
const PLURAL_KEYS = new Set(['zero', 'one', 'two', 'few', 'many', 'other'])

const errors = []
const warnings = []

function isPlural(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const keys = Object.keys(value)
  return keys.includes('other') && keys.every((k) => PLURAL_KEYS.has(k))
}

function flatten(obj, prefix, out) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string' || isPlural(value)) out.set(full, value)
    else if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, full, out)
    else errors.push(`Unsupported value type at ${full}`)
  }
  return out
}

function loadLocale(locale) {
  const dir = path.join(messagesDir, locale)
  const out = new Map()
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const ns = file.replace(/\.json$/, '')
    let parsed
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
    } catch (e) {
      errors.push(`${locale}/${file}: invalid JSON (${e.message})`)
      continue
    }
    flatten(parsed, ns, out)
  }
  return out
}

const stringsOf = (value) => (typeof value === 'string' ? [value] : Object.values(value))
const placeholdersOf = (value) => {
  const set = new Set()
  for (const s of stringsOf(value)) for (const m of s.matchAll(/\{(\w+)\}/g)) set.add(m[1])
  set.delete('count')
  return [...set].sort().join(',')
}

const uk = loadLocale('uk')
const en = loadLocale('en')

for (const key of uk.keys()) if (!en.has(key)) errors.push(`Missing in en: ${key}`)
for (const key of en.keys()) if (!uk.has(key)) errors.push(`Missing in uk: ${key}`)

const cyrillic = /[\u0400-\u04FF]/
for (const [key, value] of uk) {
  if (stringsOf(value).some((s) => !s.trim())) errors.push(`Empty uk value: ${key}`)
  const other = en.get(key)
  if (other !== undefined) {
    if (placeholdersOf(value) !== placeholdersOf(other)) {
      errors.push(`Placeholder mismatch in ${key}: uk{${placeholdersOf(value)}} vs en{${placeholdersOf(other)}}`)
    }
    if (isPlural(value) !== isPlural(other) && !(typeof value === 'string' && typeof other === 'string')) {
      warnings.push(`Plural/singular shape differs: ${key}`)
    }
  }
}
for (const [key, value] of en) {
  if (stringsOf(value).some((s) => !s.trim())) errors.push(`Empty en value: ${key}`)
  if (stringsOf(value).some((s) => cyrillic.test(s))) errors.push(`Cyrillic text in en value: ${key}`)
}

// --- Source scan -----------------------------------------------------------
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

function stripComments(code) {
  return code
    .split('\n')
    .map((line) => (line.includes('i18n-ignore') ? '' : line))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
}

const usedKeys = new Set()
const hardcoded = []
for (const file of walk(srcDir)) {
  const rel = path.relative(root, file).replace(/\\/g, '/')
  const code = stripComments(fs.readFileSync(file, 'utf8'))
  for (const m of code.matchAll(/\bt\(\s*(['"])([\w.-]+)\1/g)) usedKeys.add(m[2])
  for (const m of code.matchAll(/\bt\(\s*`([\w.-]+)`/g)) usedKeys.add(m[1])
  const lines = code.split('\n')
  let count = 0
  lines.forEach((line) => { if (cyrillic.test(line)) count++ })
  if (count) hardcoded.push({ rel, count })
}

const dynamicPrefixes = new Set()
for (const file of walk(srcDir)) {
  const code = stripComments(fs.readFileSync(file, 'utf8'))
  for (const m of code.matchAll(/\bt\(\s*`([\w.-]+)\.\$\{/g)) dynamicPrefixes.add(m[1] + '.')
  for (const m of code.matchAll(/\bt\(\s*(['"])([\w.-]+\.)\1\s*\+/g)) dynamicPrefixes.add(m[2])
}

for (const key of usedKeys) {
  if (!uk.has(key)) errors.push(`Key used in source but missing in messages: ${key}`)
}
for (const prefix of dynamicPrefixes) {
  if (![...uk.keys()].some((k) => k.startsWith(prefix))) errors.push(`Dynamic key prefix has no messages: ${prefix}*`)
}
if (args.has('--warn-unused')) {
  for (const key of uk.keys()) {
    if (usedKeys.has(key)) continue
    if ([...dynamicPrefixes].some((p) => key.startsWith(p))) continue
    warnings.push(`Possibly unused key: ${key}`)
  }
}

if (hardcoded.length) {
  const total = hardcoded.reduce((s, f) => s + f.count, 0)
  const lines = hardcoded.sort((a, b) => b.count - a.count).map((f) => `  ${String(f.count).padStart(4)}  ${f.rel}`)
  const message = `Hard-coded Cyrillic in source: ${total} lines in ${hardcoded.length} files\n${lines.join('\n')}`
  if (args.has('--strict-source')) errors.push(message)
  else warnings.push(message)
}

console.log(`uk keys: ${uk.size}, en keys: ${en.size}, keys referenced in source: ${usedKeys.size}`)
for (const w of warnings) console.warn(`WARN  ${w}`)
for (const e of errors) console.error(`ERROR ${e}`)
if (errors.length) {
  console.error(`\ni18n check failed: ${errors.length} error(s)`)
  process.exit(1)
}
console.log('i18n check passed')
