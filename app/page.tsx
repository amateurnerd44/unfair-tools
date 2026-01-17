import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full">
        <h1 className="text-5xl font-bold text-center mb-4">
          Unfair Tools
        </h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          Modern Order Management for Independent Sales Reps
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/orders"
            className="p-6 border rounded-lg hover:border-blue-500 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">📝 Orders</h2>
            <p className="text-gray-600">
              Create, manage, and track orders for your customers
            </p>
          </Link>

          <Link
            href="/products"
            className="p-6 border rounded-lg hover:border-blue-500 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">📦 Products</h2>
            <p className="text-gray-600">
              Browse and manage your product catalog
            </p>
          </Link>

          <Link
            href="/customers"
            className="p-6 border rounded-lg hover:border-blue-500 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">👥 Customers</h2>
            <p className="text-gray-600">
              Manage your customer relationships and territories
            </p>
          </Link>

          <Link
            href="/dashboard"
            className="p-6 border rounded-lg hover:border-blue-500 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">📊 Dashboard</h2>
            <p className="text-gray-600">
              View your sales performance and analytics
            </p>
          </Link>
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🚀 Getting Started</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Set up your database connection in <code className="bg-white px-2 py-1 rounded">.env</code></li>
            <li>Run <code className="bg-white px-2 py-1 rounded">npm run db:push</code> to initialize the database</li>
            <li>Configure your Shopify app credentials</li>
            <li>Start creating orders!</li>
          </ol>
        </div>
      </main>
    </div>
  );
}

