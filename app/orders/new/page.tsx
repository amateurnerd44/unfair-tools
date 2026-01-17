"use client";

import Link from "next/link";
import { useState } from "react";

export default function NewOrderPage() {
  const [orderItems, setOrderItems] = useState<Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }>>([]);

  const addItem = () => {
    setOrderItems([
      ...orderItems,
      {
        id: Math.random().toString(),
        productName: "",
        quantity: 1,
        price: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setOrderItems(
      orderItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/orders" className="text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Orders
        </Link>
        <h1 className="text-4xl font-bold mb-8">Create New Order</h1>

        <form className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Customer
                </label>
                <select className="w-full border rounded-lg px-4 py-2">
                  <option>Select a customer...</option>
                </select>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Order Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                + Add Item
              </button>
            </div>

            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No items added yet. Click "Add Item" to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 items-start border p-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Product name"
                        value={item.productName}
                        onChange={(e) =>
                          updateItem(item.id, "productName", e.target.value)
                        }
                        className="w-full border rounded px-3 py-2 mb-2"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", parseInt(e.target.value) || 0)
                          }
                          className="w-24 border rounded px-3 py-2"
                          min="1"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.id, "price", parseFloat(e.target.value) || 0)
                          }
                          className="flex-1 border rounded px-3 py-2"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold mb-2">
                        ${(item.quantity * item.price).toFixed(2)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Order Notes</h2>
            <textarea
              className="w-full border rounded-lg px-4 py-2"
              rows={4}
              placeholder="Add any special instructions or notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link
              href="/orders"
              className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

