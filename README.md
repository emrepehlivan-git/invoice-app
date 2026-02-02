# Invoice App

A modern, secure, and scalable invoice management application built with Next.js, designed for freelancers, small businesses, and accounting teams. The application provides an intuitive interface for creating, managing, and tracking invoices with multi-tenant organization support.

## Features

### Core Functionality

- **Invoice Management**: Create, edit, and manage invoices with line items, tax calculations, and multiple statuses (Draft, Sent, Paid, Overdue, Cancelled)
- **Customer Management**: Comprehensive customer database with contact information, tax details, and address management
- **Multi-Currency Support**: Support for multiple currencies with exchange rate tracking and automatic conversion to base currency
- **Organization Management**: Multi-tenant architecture allowing users to create and manage multiple organizations
- **Role-Based Access Control**: Admin and Member roles with organization-based isolation
- **Audit Logging**: Comprehensive audit trail for all critical actions (create, update, delete, status changes)
- **Internationalization**: Full support for English and Turkish with easy extensibility to additional languages

### Technical Features

- **Modern UI**: Built with shadcn/ui components and Tailwind CSS for a beautiful, responsive interface
- **Secure Authentication**: Better Auth integration with email/password and OAuth (Google) support
- **Type Safety**: Full TypeScript support with strict mode enabled
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Docker Support**: Complete Docker Compose setup for easy local development and deployment
- **Server Actions**: Next.js Server Actions for efficient server-side operations
- **Form Validation**: Zod schemas with React Hook Form for robust form handling

## Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **shadcn/ui** components
- **next-intl** for internationalization
- **React Hook Form** with Zod validation

### Backend
- **Next.js API Routes** / **Server Actions**
- **Prisma ORM 6**
- **PostgreSQL 16**
- **Better Auth** for authentication

### Infrastructure
- **Docker** & **Docker Compose**
- **Bun** as package manager and runtime

### Additional Libraries
- **Winston** for logging
- **date-fns** for date manipulation
- **Sonner** for toast notifications

## Prerequisites

- **Docker** and **Docker Compose** (for containerized setup)
- **Bun** (for local development without Docker)
- **PostgreSQL 16** (if running without Docker)

## Getting Started

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoice-app
   ```

2. **Set up environment variables**
   ```bash
   cd docker
   cp .env.example .env  # Create .env file if it doesn't exist
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=invoice_app
   
   # Next.js
   NEXTAUTH_SECRET=your_secret_key
   NEXTAUTH_URL=http://localhost:3000
   
   # Better Auth
   BETTER_AUTH_SECRET=your_auth_secret
   BETTER_AUTH_URL=http://localhost:3000
   
   # OAuth (Optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Start the application**
   ```bash
   # Using Makefile
   make up
   
   # Or directly with Docker Compose
   cd docker && docker compose up -d
   ```

4. **Run database migrations**
   ```bash
   make migrate
   
   # Or directly
   cd docker && docker compose --profile migrate up migrate
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/invoice_app"
   NEXTAUTH_SECRET=your_secret_key
   NEXTAUTH_URL=http://localhost:3000
   BETTER_AUTH_SECRET=your_auth_secret
   BETTER_AUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma Client
   bun run db:generate
   
   # Run migrations
   bun run db:migrate
   ```

4. **Start the development server**
   ```bash
   bun run dev
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

### Development
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint

### Database
- `bun run db:generate` - Generate Prisma Client
- `bun run db:push` - Push schema changes to database (dev)
- `bun run db:migrate` - Create and apply migrations
- `bun run db:migrate:deploy` - Apply migrations (production)
- `bun run db:migrate:reset` - Reset database (dev only)
- `bun run db:migrate:status` - Check migration status
- `bun run db:studio` - Open Prisma Studio

### Docker (using Makefile)
- `make up` - Start all services
- `make down` - Stop all services
- `make logs` - View application logs
- `make migrate` - Run database migrations
- `make build` - Build and start services
- `make restart` - Restart services
- `make ps` - List running services

## Project Structure

```
invoice-app/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Internationalized routes
│   │   ├── (auth)/               # Authentication routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/          # Dashboard routes
│   │   │   ├── customers/
│   │   │   ├── invoices/
│   │   │   └── settings/
│   │   └── [orgSlug]/            # Organization-scoped routes
│   ├── actions/                  # Server Actions
│   │   ├── customer.ts
│   │   ├── invoice.ts
│   │   ├── organization.ts
│   │   └── user.ts
│   └── api/                      # API routes
│       └── auth/
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── common/                   # Shared components
│   ├── customers/
│   ├── invoices/
│   └── settings/
├── lib/                          # Utility libraries
│   ├── auth/                     # Better Auth configuration
│   ├── db/                       # Prisma client
│   ├── validators/               # Zod schemas
│   ├── errors/                   # Error handling
│   ├── logger/                   # Winston logger
│   └── audit/                    # Audit logging
├── instrumentation.ts            # Next.js instrumentation (node-cron: overdue invoices daily)
├── i18n/                         # Internationalization
│   ├── config.ts
│   ├── navigation.ts
│   └── request.ts
├── messages/                     # Translation files
│   ├── en.json
│   └── tr.json
├── prisma/                       # Prisma configuration
│   ├── schema.prisma
│   └── migrations/
├── docker/                       # Docker configuration
│   ├── Dockerfile
│   └── docker-compose.yml
└── types/                        # TypeScript type definitions
```

## Database Schema

The application uses the following main models:

- **User**: Authentication and user profiles
- **Organization**: Multi-tenant organizations
- **OrganizationMember**: User-organization relationships with roles
- **Customer**: Customer information
- **Invoice**: Invoice records with status tracking
- **InvoiceItem**: Line items for invoices
- **ExchangeRate**: Currency exchange rates for organizations
- **AuditLog**: Audit trail for critical actions

See `prisma/schema.prisma` for the complete schema definition.

## Authentication

The application uses Better Auth for authentication with support for:

- Email/password authentication
- OAuth providers (Google)
- Email verification
- Session management

## Internationalization

The application supports multiple languages using `next-intl`:

- **English** (en) - Default
- **Turkish** (tr)

To add a new language:
1. Add the locale to `i18n/config.ts`
2. Create a translation file in `messages/`
3. Update routing configuration

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000

# OAuth (Optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Next.js
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

## Development Guidelines

### Code Organization

- Follow the folder structure outlined in the project structure
- Use path aliases (`@/`) instead of relative imports
- Import navigation utilities from `@/i18n/navigation`, never from `next/navigation`

### TypeScript

- Strict mode is enabled - explicitly define all types
- Avoid `any`, use `unknown` if necessary
- Import Prisma types from `@/types/prisma`

### Form Validation

- Use Zod schemas for validation
- Integrate with React Hook Form
- Define schemas in `lib/validators/`

### Error Handling

- Use the centralized error handling system in `lib/errors/`
- Return proper error codes and messages
- Log errors using the Winston logger

## Deployment

### Production Build

1. **Build the application**
   ```bash
   bun run build
   ```

2. **Run migrations**
   ```bash
   bun run db:migrate:deploy
   ```

3. **Start the server**
   ```bash
   bun run start
   ```

### Docker Deployment

The application is configured for Docker deployment with a multi-stage Dockerfile:

1. **Build and start with Docker Compose**
   ```bash
   cd docker
   docker compose up -d --build
   ```

2. **The Docker setup includes:**
   - PostgreSQL database service
   - Automatic migration service
   - Next.js application service

### Scheduled Jobs (Self-Hosted)

Overdue invoice marking runs as a **scheduled job** via `node-cron` and Next.js `instrumentation.ts`:

- **Schedule:** Daily at 00:00 (server local time)
- **Behavior:** Faturaların vadesi geçmiş ve status `SENT` olan kayıtlar otomatik `OVERDUE` yapılır
- **Gereksinim:** Uygulama uzun süre çalışan bir Node süreci olarak çalışmalı (`next start` veya Docker); serverless (Vercel vb.) ortamda bu job çalışmaz, sadece fatura listesi sayfası açıldığında güncelleme yapılır

Ek cron kütüphanesi veya harici servis gerekmez; self-hosted veya Docker deploy'da otomatik devreye girer.

## Security Features

- **Role-Based Access Control**: Admin and Member roles
- **Organization Isolation**: Multi-tenant data separation
- **Audit Logging**: Comprehensive audit trail
- **Secure Authentication**: Better Auth with session management
- **Input Validation**: Zod schemas for all user inputs
- **SQL Injection Protection**: Prisma ORM parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues, questions, or contributions, please open an issue in the repository.

---

Built with ❤️ using Next.js, Prisma, and modern web technologies.
