/**
 * WayForPay helper
 * Підпис, формування платежу, валідація callback
 */
import crypto from 'crypto'

export type SignatureAlgo = 'md5' | 'sha1'

function hmacHex(algo: SignatureAlgo, data: string, secret: string) {
  return crypto.createHmac(algo, secret).update(data).digest('hex')
}

/**
 * Обчислити підпис WayForPay (за замовчуванням HMAC-MD5).
 * Docs: concat params with ';' у визначеному порядку.
 */
export function computeSignature(paramsInOrder: (string | number)[], secret: string, algo: SignatureAlgo = 'md5') {
  const data = paramsInOrder.map(v => String(v)).join(';')
  return hmacHex(algo, data, secret)
}

/**
 * Перевірка підпису callback.
 * Деякі інтеграції використовують md5, інші — sha1. Перевіряємо обидва для надійності, якщо явно не вказано.
 */
export function verifySignature(paramsInOrder: (string | number)[], secret: string, provided: string, algo?: SignatureAlgo) {
  if (algo) {
    return computeSignature(paramsInOrder, secret, algo).toLowerCase() === String(provided).toLowerCase()
  }
  const md5 = computeSignature(paramsInOrder, secret, 'md5')
  if (md5.toLowerCase() === String(provided).toLowerCase()) return true
  const sha1 = computeSignature(paramsInOrder, secret, 'sha1')
  return sha1.toLowerCase() === String(provided).toLowerCase()
}

export interface CreatePaymentInput {
  orderReference: string
  amount: number
  currency?: string
  description?: string
}

export interface WayForPayFormPayload {
  merchantAccount: string
  merchantDomainName: string
  orderReference: string
  orderDate: number
  amount: number
  currency: string
  productName: string[]
  productCount: number[]
  productPrice: number[]
  serviceUrl?: string
  returnUrl?: string
  merchantSignature: string
}

export function buildWayForPayFormPayload(input: CreatePaymentInput): WayForPayFormPayload {
  const merchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT || ''
  const merchantDomainName = process.env.WAYFORPAY_DOMAIN_NAME || (process.env.NEXT_PUBLIC_SITE_URL || '')
  const secret = process.env.WAYFORPAY_MERCHANT_SECRET || ''
  const currency = input.currency || process.env.WAYFORPAY_CURRENCY || 'UAH'
  const orderDate = Math.floor(Date.now() / 1000)

  const productName = [input.description || 'Поповнення балансу (уцмка)']
  const productCount = [1]
  const productPrice = [input.amount]

  const base: Omit<WayForPayFormPayload, 'merchantSignature'> = {
    merchantAccount,
    merchantDomainName,
    orderReference: input.orderReference,
    orderDate,
    amount: input.amount,
    currency,
    productName,
    productCount,
    productPrice,
    serviceUrl: process.env.WAYFORPAY_SERVICE_URL,
    returnUrl: process.env.WAYFORPAY_RETURN_URL,
  }

  // Порядок полів для підпису форми оплати згідно WFP: 
  // merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;productName[0];productCount[0];productPrice[0]
  const signParams = [
    base.merchantAccount,
    base.merchantDomainName,
    base.orderReference,
    base.orderDate,
    base.amount,
    base.currency,
    base.productName[0],
    base.productCount[0],
    base.productPrice[0],
  ]
  const merchantSignature = computeSignature(signParams, secret, 'md5')

  return { ...base, merchantSignature }
}

export function makeOrderReference(prefix = 'SVIY'): string {
  const ts = Date.now()
  const rnd = Math.floor(10000 + Math.random() * 89999)
  return `${prefix}-${ts}-${rnd}`
}

export type CallbackPayload = {
  merchantAccount: string
  orderReference: string
  amount: number
  currency: string
  authCode?: string
  email?: string
  phone?: string
  createdDate?: number
  processingDate?: number
  cardPan?: string
  cardType?: string
  issuerBankCountry?: string
  issuerBankName?: string
  recToken?: string
  transactionStatus: 'Approved' | 'Declined' | 'Expired' | 'InProcessing' | 'Pending' | string
  reason?: string
  reasonCode?: string | number
  fee?: number
  paymentSystem?: string
  merchantSignature: string
}

/**
 * Перевірити підпис callback. Для стандартного callback WayForPay поле-порядок такий:
 * merchantAccount;orderReference;amount;currency
 */
export function verifyCallbackSignature(cb: CallbackPayload): boolean {
  const secret = process.env.WAYFORPAY_MERCHANT_SECRET || ''
  const params = [cb.merchantAccount, cb.orderReference, cb.amount, cb.currency]
  return verifySignature(params, secret, cb.merchantSignature)
}

export const WAYFORPAY_ENDPOINT = 'https://secure.wayforpay.com/pay'
