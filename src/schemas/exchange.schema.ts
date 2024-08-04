import { z } from 'zod';
import { Prisma } from '@prisma/client';

enum ExchangeStatusType {
  active = 'active',
  inactive = 'inactive',
}

export const createExchangeSchema = z.object({
  name: z.string().min(1).max(255),
  apiKey: z.string().nullable(),
  apiSecret: z.string().nullable(),
  passphrase: z.string().nullable(),
  status: z.nativeEnum(ExchangeStatusType)
}) satisfies z.ZodType<Prisma.ExchangeCreateInput>;

export const updateExchangeSchema = createExchangeSchema.partial();

export type CreateExchangeInput = z.infer<typeof createExchangeSchema>;
export type UpdateExchangeInput = z.infer<typeof updateExchangeSchema>;