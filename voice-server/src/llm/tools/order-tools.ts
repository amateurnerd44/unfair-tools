import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import { CallContext } from "../conversation";

const prisma = new PrismaClient();

export const orderTools: Anthropic.Tool[] = [
  {
    name: "lookup_order",
    description:
      "Look up an order by order number or by the caller's phone number. Returns order status, items, and totals.",
    input_schema: {
      type: "object" as const,
      properties: {
        order_number: {
          type: "string",
          description: "The order number, e.g. ORD-1234",
        },
        use_caller_phone: {
          type: "boolean",
          description:
            "If true, look up the most recent order for the caller's phone number instead of by order number",
        },
      },
    },
  },
  {
    name: "list_recent_orders",
    description:
      "List the caller's most recent orders. Uses the caller's phone number to find their customer record.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "How many recent orders to return (default 5)",
        },
      },
    },
  },
];

export async function executeOrderTool(
  name: string,
  input: Record<string, unknown>,
  context: CallContext
): Promise<string> {
  switch (name) {
    case "lookup_order":
      return lookupOrder(input, context);
    case "list_recent_orders":
      return listRecentOrders(input, context);
    default:
      return JSON.stringify({ error: `Unknown order tool: ${name}` });
  }
}

async function lookupOrder(
  input: Record<string, unknown>,
  context: CallContext
): Promise<string> {
  const where = input.use_caller_phone
    ? { customer: { phone: context.callerNumber } }
    : { orderNumber: input.order_number as string };

  const order = await prisma.order.findFirst({
    where,
    include: {
      items: { include: { product: true } },
      customer: true,
      salesRep: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!order) {
    return JSON.stringify({
      found: false,
      message: "No matching order found",
    });
  }

  return JSON.stringify({
    found: true,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    customerName: order.customer.name,
    salesRep: order.salesRep.name,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      product: item.product.title,
      quantity: item.quantity,
      price: item.price,
    })),
    notes: order.notes,
  });
}

async function listRecentOrders(
  input: Record<string, unknown>,
  context: CallContext
): Promise<string> {
  const limit = (input.limit as number) || 5;

  const customer = await prisma.customer.findFirst({
    where: { phone: context.callerNumber },
  });

  if (!customer) {
    return JSON.stringify({
      found: false,
      message: "No customer found for this phone number",
    });
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
    },
  });

  return JSON.stringify({
    found: true,
    customerName: customer.name,
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      date: o.createdAt.toISOString(),
    })),
  });
}
