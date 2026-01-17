import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/orders - List all orders
export async function GET(request: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        salesRep: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, salesRepId, items, notes, shippingAddress } = body;

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.price,
      0
    );
    const tax = 0; // TODO: Calculate tax
    const shipping = 0; // TODO: Calculate shipping
    const total = subtotal + tax + shipping;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        salesRepId,
        subtotal,
        tax,
        shipping,
        total,
        notes,
        shippingAddress,
        status: 'DRAFT',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        salesRep: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

