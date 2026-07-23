import { prisma } from "@/lib/prisma";
import type { UpdateQuarterEntryInput } from "@/types";

// def updateQuarterEntry(input, updatedById): Input is which DocItem and
// quarter changed, plus the new currentInventory and/or forPurchase value
// (either can be omitted to leave that field untouched), and the id of the
// logged-in user making the edit. Output is the updated QuarterEntry row.
// Called on cell blur from the editable grid (the client debounces this so
// every keystroke doesn't trigger a request).
export async function updateQuarterEntry(input: UpdateQuarterEntryInput, updatedById: string) {
  const { docItemId, quarter } = input;

  const data: { currentInventory?: number | null; forPurchase?: number | null } = {};
  if ("currentInventory" in input) data.currentInventory = input.currentInventory ?? null;
  if ("forPurchase" in input) data.forPurchase = input.forPurchase ?? null;

  return prisma.quarterEntry.upsert({
    where: { docItemId_quarter: { docItemId, quarter } },
    update: { ...data, updatedById },
    create: {
      docItemId,
      quarter,
      currentInventory: input.currentInventory ?? null,
      forPurchase: input.forPurchase ?? null,
      updatedById,
    },
  });
}
