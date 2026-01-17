import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const products = await prisma.product.findMany({
      where: active !== null ? { active: active === 'true' } : undefined,
      orderBy: {
        title: 'asc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product (or sync from Shopify)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopifyId, title, description, price, sku, imageUrl, inventory } = body;

    const product = await prisma.product.create({
      data: {
        shopifyId,
        title,
        description,
        price,
        sku,
        imageUrl,
        inventory: inventory || 0,
        active: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

