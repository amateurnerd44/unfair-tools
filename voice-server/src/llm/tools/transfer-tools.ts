import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import { CallContext } from "../conversation";

const prisma = new PrismaClient();

export type TransferHandler = (
  callSid: string,
  targetNumber: string
) => Promise<void>;

export const transferTools: Anthropic.Tool[] = [
  {
    name: "transfer_to_sales_rep",
    description:
      "Transfer the call to the caller's assigned sales rep. Only use when the caller specifically requests to speak with a person or when you cannot resolve their issue.",
    input_schema: {
      type: "object" as const,
      properties: {
        reason: {
          type: "string",
          description: "Brief reason for the transfer",
        },
      },
      required: ["reason"],
    },
  },
];

export async function executeTransferTool(
  name: string,
  input: Record<string, unknown>,
  context: CallContext,
  transferHandler: TransferHandler
): Promise<string> {
  switch (name) {
    case "transfer_to_sales_rep":
      return transferToRep(input, context, transferHandler);
    default:
      return JSON.stringify({ error: `Unknown transfer tool: ${name}` });
  }
}

async function transferToRep(
  input: Record<string, unknown>,
  context: CallContext,
  transferHandler: TransferHandler
): Promise<string> {
  const customer = await prisma.customer.findFirst({
    where: { phone: context.callerNumber },
    include: { salesRep: true },
  });

  if (!customer?.salesRep?.phone) {
    return JSON.stringify({
      transferred: false,
      message:
        "Could not find a sales rep phone number for this customer. Please try calling back during business hours.",
    });
  }

  try {
    await transferHandler(context.callSid, customer.salesRep.phone);
    return JSON.stringify({
      transferred: true,
      salesRepName: customer.salesRep.name,
      reason: input.reason,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return JSON.stringify({
      transferred: false,
      message: `Transfer failed: ${msg}`,
    });
  }
}
