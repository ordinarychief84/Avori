import type { CreditTxType } from '@prisma/client';
import { prisma } from './prisma';
import { HttpError } from './auth';

export async function ensureCreditAccount(brandId: string, customerId: string) {
  return prisma.creditAccount.upsert({
    where: { customerId },
    update: {},
    create: { brandId, customerId },
  });
}

// Single entry point for every balance change so the ledger and the cached
// balance can never drift. `amount` is signed: positive issues credit,
// negative spends it.
export async function addCredit(params: {
  brandId: string;
  customerId: string;
  type: CreditTxType;
  amount: number;
  reason?: string;
  orderId?: string;
}) {
  const account = await ensureCreditAccount(params.brandId, params.customerId);
  const newBalance = Number(account.balance) + params.amount;
  if (newBalance < 0) throw new HttpError(400, 'Insufficient store credit');

  const [updated] = await prisma.$transaction([
    prisma.creditAccount.update({
      where: { id: account.id },
      data: { balance: newBalance },
    }),
    prisma.creditTransaction.create({
      data: {
        brandId: params.brandId,
        accountId: account.id,
        type: params.type,
        amount: params.amount,
        reason: params.reason ?? null,
        orderId: params.orderId ?? null,
      },
    }),
  ]);
  return updated;
}
