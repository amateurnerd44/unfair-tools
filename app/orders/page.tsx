import Link from "next/link";

export default function OrdersPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold">Orders</h1>
            <p className="text-gray-600 mt-2">Manage and create orders for your customers</p>
          </div>
          <Link
            href="/orders/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            + New Order
          </Link>
        </div>

        <div className="bg-white border rounded-lg p-8">
          <div className="text-center text-gray-500">
            <p className="text-xl mb-4">No orders yet</p>
            <p>Create your first order to get started!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
