# Unfair Tools

Modern order management platform for independent sales reps, deeply integrated with Shopify to challenge antiquated solutions like MarketTime.

## 🚀 Features

- **Order Management**: Create, track, and manage orders for your customers
- **Product Catalog**: Browse and manage products synced from Shopify
- **Customer Management**: Track customer relationships and territories
- **Shopify Integration**: Deep integration with Shopify for seamless order fulfillment
- **Sales Rep Dashboard**: Track performance and analytics

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Shopify Integration**: @shopify/shopify-api
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Tables**: TanStack Table

## 📦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Shopify Partner account (for app credentials)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/amateurnerd44/unfair-tools.git
   cd unfair-tools
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SHOPIFY_API_KEY`: Your Shopify app API key
   - `SHOPIFY_API_SECRET`: Your Shopify app secret
   - `SHOPIFY_SCOPES`: Required OAuth scopes
   - `SHOPIFY_HOST`: Your Shopify store domain

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The app uses the following core models:

- **SalesRep**: Sales representative accounts
- **Customer**: Retailers/customers managed by reps
- **Product**: Products synced from Shopify
- **Order**: Orders created by reps
- **OrderItem**: Line items within orders

## 📝 Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

## 🔐 Shopify Integration

### Setting up a Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Create a new app
3. Configure OAuth redirect URLs
4. Copy API credentials to `.env`

### Required Scopes

- `read_products` - Access product catalog
- `write_orders` - Create orders on behalf of customers
- `read_customers` - Access customer information

## 🚧 Roadmap

- [ ] Shopify OAuth authentication flow
- [ ] Product sync from Shopify
- [ ] Order submission to Shopify
- [ ] Customer import from Shopify
- [ ] Advanced order filtering and search
- [ ] Sales analytics dashboard
- [ ] Territory management
- [ ] Multi-rep organization support
- [ ] Mobile app

## 🤝 Contributing

This is a private project, but suggestions and feedback are welcome!

## 📄 License

Proprietary - All rights reserved

## 🎯 Why "Unfair Tools"?

Because giving independent sales reps modern, powerful tools shouldn't be a luxury. It should be the standard. We're building the unfair advantage that levels the playing field against marketplaces like Faire.com.

