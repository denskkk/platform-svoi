export const INVOICE_CURRENCIES = ['UAH', 'USD', 'EUR'] as const;
export const INVOICE_LIMITS = { pageSize: 20, maxAmount: 10_000_000 } as const;

export function serializeInvoice(r: any, viewerId: number) {
  const name = (u: any) => u?.businessInfo?.companyName || `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
  return {
    id: r.id, amount: Number(r.amount), currency: r.currency, description: r.description, status: r.status,
    dueAt: r.dueAt, paidAt: r.paidAt, createdAt: r.createdAt,
    isIssuer: r.issuerId === viewerId,
    issuer: { id: r.issuer.id, name: name(r.issuer), avatarUrl: r.issuer.avatarUrl },
    payer: { id: r.payer.id, name: name(r.payer), avatarUrl: r.payer.avatarUrl },
  };
}
