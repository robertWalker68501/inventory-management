import prisma from '@/lib/prisma';

const PREFIXES = {
  PO: 'PO',
  REC: 'REC',
  ORD: 'ORD',
  SHP: 'SHP',
} as const;

type DocumentPrefix = keyof typeof PREFIXES;

function parseSequence(number: string, prefix: string) {
  const match = number.match(new RegExp(`^${prefix}-(\\d+)$`));
  return match ? Number.parseInt(match[1], 10) : 0;
}

export async function getNextDocumentNumber(
  tenantId: string,
  type: DocumentPrefix
): Promise<string> {
  const prefix = PREFIXES[type];

  let latestNumber: string | null = null;

  switch (type) {
    case 'PO': {
      const latest = await prisma.purchaseOrder.findFirst({
        where: { tenantId, number: { startsWith: `${prefix}-` } },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      latestNumber = latest?.number ?? null;
      break;
    }
    case 'REC': {
      const latest = await prisma.receiving.findFirst({
        where: { tenantId, number: { startsWith: `${prefix}-` } },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      latestNumber = latest?.number ?? null;
      break;
    }
    case 'ORD': {
      const latest = await prisma.order.findFirst({
        where: { tenantId, number: { startsWith: `${prefix}-` } },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      latestNumber = latest?.number ?? null;
      break;
    }
    case 'SHP': {
      const latest = await prisma.shipment.findFirst({
        where: { tenantId, number: { startsWith: `${prefix}-` } },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      latestNumber = latest?.number ?? null;
      break;
    }
  }

  const next = (latestNumber ? parseSequence(latestNumber, prefix) : 0) + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}
