import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import { CallContext } from "../conversation";

const prisma = new PrismaClient();

export const customerTools: Anthropic.Tool[] = [
  {
    name: "lookup_customer",
    description:
      "Look up a customer by phone number or name. Returns customer details and their assigned sales rep.",
    input_schema: {
      type: "object" as const,
      properties: {
        phone: {
          type: "string",
          description: "Phone number to search for",
        },
        name: {
          type: "string",
          description: "Customer name to search for",
        },
        use_caller_phone: {
          type: "boolean",
          description: "If true, use the caller's phone number",
        },
      },
    },
  },
];

export async function executeCustomerTool(
  name: string,
  input: Record<string, unknown>,
  context: CallContext
): Promise<string> {
  switch (name) {
    case "lookup_customer":
      return lookupCustomer(input, context);
    default:
      return JSON.stringify({ error: `Unknown customer tool: ${name}` });
  }
}

async function lookupCustomer(
  input: Record<string, unknown>,
  context: CallContext
): Promise<string> {
  const phone = input.use_caller_phone
    ? context.callerNumber
    : (input.phone as string | undefined);

  const where = phone
    ? { phone }
    : { name: { contains: input.name as string, mode: "insensitive" as const } };

  const customer = await prisma.customer.findFirst({
    where,
    include: { salesRep: true },
  });

  if (!customer) {
    return JSON.stringify({
      found: false,
      message: "No matching customer found",
    });
  }

  return JSON.stringify({
    found: true,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    salesRep: {
      name: customer.salesRep.name,
      email: customer.salesRep.email,
      phone: customer.salesRep.phone,
    },
  });
}
