import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseAcceptLanguage, resolveLocale } from '../src/i18n/config.ts'
import { createTranslator } from '../src/i18n/translate.ts'
import { localizedPath, splitLocalePrefix, switchLocalePath, isPublicLocalizedPath } from '../src/i18n/routes.ts'
import { getMessages } from '../src/i18n/messages.ts'

test('parseAcceptLanguage picks the highest-ranked supported language', () => {
  assert.equal(parseAcceptLanguage('en-US,en;q=0.9,uk;q=0.8'), 'en')
  assert.equal(parseAcceptLanguage('uk-UA,uk;q=0.9,en;q=0.5'), 'uk')
  assert.equal(parseAcceptLanguage('de-DE,de;q=0.9,en;q=0.7'), 'en')
  assert.equal(parseAcceptLanguage('de-DE'), null)
  assert.equal(parseAcceptLanguage(''), null)
})

test('resolveLocale: cookie wins, then Accept-Language, then Ukrainian', () => {
  assert.equal(resolveLocale('sviy_locale=uk', 'en'), 'uk')
  assert.equal(resolveLocale('a=b', 'en-GB'), 'en')
  assert.equal(resolveLocale(null, 'fr'), 'uk')
  assert.equal(resolveLocale('sviy_locale=xx', null), 'uk')
})

test('translator interpolates, pluralises and falls back safely', () => {
  const uk = { a: { hi: 'Привіт, {name}', n: { one: '{count} відгук', few: '{count} відгуки', many: '{count} відгуків', other: '{count} відгуку' } } }
  const en = { a: { hi: 'Hello, {name}', n: { one: '{count} review', other: '{count} reviews' }, onlyEn: 'Only EN' } }
  const tuk = createTranslator('uk', uk, en)
  const ten = createTranslator('en', en, uk)
  assert.equal(tuk('a.hi', { name: 'Іра' }), 'Привіт, Іра')
  assert.equal(tuk('a.n', { count: 1 }), '1 відгук')
  assert.equal(tuk('a.n', { count: 3 }), '3 відгуки')
  assert.equal(tuk('a.n', { count: 5 }), '5 відгуків')
  assert.equal(ten('a.n', { count: 1 }), '1 review')
  assert.equal(ten('a.n', { count: 2 }), '2 reviews')
  assert.equal(tuk('a.onlyEn'), 'Only EN')
  assert.equal(tuk('a.missing.key'), 'a.missing.key')
  assert.equal(ten('a.hi'), 'Hello, {name}')
})

test('locale routes: only public pages get an /en prefix', () => {
  assert.equal(localizedPath('/', 'en'), '/en')
  assert.equal(localizedPath('/about', 'en'), '/en/about')
  assert.equal(localizedPath('/about', 'uk'), '/about')
  assert.equal(localizedPath('/catalog', 'en'), '/catalog')
  assert.equal(localizedPath('/privacy?x=1', 'en'), '/en/privacy?x=1')
  assert.deepEqual(splitLocalePrefix('/en/about'), { locale: 'en', path: '/about' })
  assert.deepEqual(splitLocalePrefix('/en'), { locale: 'en', path: '/' })
  assert.deepEqual(splitLocalePrefix('/engineering'), { locale: null, path: '/engineering' })
  assert.equal(switchLocalePath('/en/support', 'uk'), '/support')
  assert.equal(switchLocalePath('/chat', 'en'), '/chat')
  assert.equal(isPublicLocalizedPath('/account-deletion/'), true)
})

test('shipped dictionaries have the legal and support pages in both languages', () => {
  for (const locale of ['uk', 'en']) {
    const m = getMessages(locale)
    for (const ns of ['legal', 'support', 'about', 'meta']) {
      assert.ok(Object.keys(m[ns]).length > 0, `${locale}.${ns} is empty`)
    }
  }
})
