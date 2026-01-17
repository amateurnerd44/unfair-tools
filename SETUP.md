# Setup Guide for Unfair Tools

This guide will walk you through setting up the development environment for Unfair Tools.

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js and React
- Prisma and PostgreSQL client
- Shopify API SDK
- TailwindCSS
- TypeScript

## Step 2: Set Up PostgreSQL Database

You'll need a PostgreSQL database. You have several options:

### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a new database:
   ```sql
   CREATE DATABASE unfair_tools;
   ```
3. Your connection string will be:
   ```
   postgresql://username:password@localhost:5432/unfair_tools?schema=public
   ```

### Option B: Heroku Postgres

Since you mentioned Heroku in your custom instructions:

1. Install Heroku CLI: `npm install -g heroku`
2. Login: `heroku login`
3. Create a new Heroku app: `heroku create your-app-name`
4. Add PostgreSQL addon: `heroku addons:create heroku-postgresql:mini`
5. Get your database URL: `heroku config:get DATABASE_URL`
6. Copy this URL to your `.env` file

### Option C: Other Cloud Providers

- **Neon**: Free serverless PostgreSQL (https://neon.tech)
- **Supabase**: Free tier with PostgreSQL (https://supabase.com)
- **Railway**: Easy deployment with PostgreSQL (https://railway.app)

## Step 3: Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/unfair_tools?schema=public"

# Shopify App Credentials (get these from Shopify Partners)
SHOPIFY_API_KEY="your_shopify_api_key"
SHOPIFY_API_SECRET="your_shopify_api_secret"
SHOPIFY_SCOPES="read_products,write_orders,read_customers"
SHOPIFY_HOST="your-shop.myshopify.com"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Step 4: Set Up Shopify App (Optional for now)

You can skip this initially and set it up later. When you're ready:

1. Go to https://partners.shopify.com/
2. Create a new app
3. Get your API credentials
4. Configure OAuth redirect URL: `http://localhost:3000/api/auth/shopify/callback`

## Step 5: Initialize Database

Run Prisma commands to set up your database schema:

```bash
# Push the schema to your database
npm run db:push

# Generate Prisma Client
npm run db:generate
```

## Step 6: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see your app!

## Step 7: Explore the App

The initial setup includes:
- ✅ Home page with navigation
- ✅ Orders page (empty state)
- ✅ New order form (UI only, not connected to API yet)
- ✅ API routes for orders and products
- ✅ Database schema for all core models

## Next Steps

Now you're ready to:
1. Add sample data to test the order flow
2. Connect the order form to the API
3. Set up Shopify OAuth
4. Build out the product sync functionality
5. Add customer management

## Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running
- Check your DATABASE_URL is correct
- Try connecting with: `npx prisma studio`

### Port Already in Use
- Next.js runs on port 3000 by default
- Change it with: `npm run dev -- -p 3001`

### Prisma Issues
- Clear generated files: `rm -rf node_modules/.prisma`
- Regenerate: `npm run db:generate`

## Development Tools

### Prisma Studio (Database GUI)
```bash
npm run db:studio
```
This opens a visual editor for your database at http://localhost:5555

### Database Migrations
When you change the schema:
```bash
npm run db:migrate
```

## Need Help?

Tag @Codegen in ClickUp with any questions!

