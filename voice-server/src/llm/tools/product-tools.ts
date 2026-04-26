import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import { CallContext } from "../conversation";

const prisma = new PrismaClient();

export const productTools: Anthropic.Tool[] = [
  {
    name: "search_products",
    description:
      "Search for products by name or keyword. Returns matching products with prices and availability.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Product name or keyword to search for",
        },
        limit: {
          type: "number",
          description: "Maximum results to return (default 5)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "check_product_availability",
    description: "Check inventory availability for a specific product by SKU or name.",
    input_schema: {
      type: "object" as const,
      properties: {
        sku: {
          type: "string",
          description: "Product SKU",
        },
        product_name: {
          type: "string",
          description: "Product name to search for",
        },
      },
    },
  },
];

export async function executeProductTool(
  name: string,
  input: Record<string, unknown>,
  _context: CallContext
): Promise<string> {
  switch (name) {
    case "search_products":
      return searchProducts(input);
    case "check_product_availability":
      return checkAvailability(input);
    default:
      return JSON.stringify({ error: `Unknown product tool: ${name}` });
  }
}

async function searchProducts(
  input: Record<string, unknown>
): Promise<string> {
  const query = input.query as string;
  const limit = (input.limit as number) || 5;

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    select: {
      title: true,
      sku: true,
      price: true,
      inventory: true,
      description: true,
    },
  });

  if (products.length === 0) {
    return JSON.stringify({
      found: false,
      message: `No products matching "${query}"`,
    });
  }

  return JSON.stringify({
    found: true,
    products: products.map((p) => ({
      name: p.title,
      sku: p.sku,
      price: p.price,
      inStock: p.inventory > 0,
      inventory: p.inventory,
      description: p.description,
    })),
  });
}

async function checkAvailability(
  input: Record<string, unknown>
): Promise<string> {
  const where = input.sku
    ? { sku: input.sku as string }
    : { title: { contains: input.product_name as string, mode: "insensitive" as const } };

  const product = await prisma.product.findFirst({ where });

  if (!product) {
    return JSON.stringify({
      found: false,
      message: "Product not found",
    });
  }

  return JSON.stringify({
    found: true,
    name: product.title,
    sku: product.sku,
    inStock: product.inventory > 0,
    inventory: product.inventory,
    price: product.price,
  });
}
