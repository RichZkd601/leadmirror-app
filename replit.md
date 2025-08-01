# LeadMirror

## Overview

LeadMirror is a SaaS application that analyzes commercial conversations and generates effective follow-up messages using AI. The application allows users to input sales conversations (emails or call summaries), analyzes them using OpenAI's GPT-4o model, and provides insights including prospect interest levels, potential objections, strategic advice, and ready-to-use follow-up messages.

## User Preferences

Preferred communication style: Simple, everyday language.
Language: French language support implemented throughout the application interface.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for build tooling
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming support
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple
- **API Design**: RESTful endpoints with Express middleware for authentication

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database serverless
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Storage**: PostgreSQL table for user sessions
- **Database Tables**:
  - Users: Profile information and subscription status
  - Analyses: Conversation analysis results and metadata
  - Sessions: User authentication sessions

### Authentication and Authorization
- **Provider**: Replit Auth with OAuth integration
- **Session Management**: Express sessions with secure HTTP-only cookies
- **User Management**: Automatic user creation/update on login
- **Authorization**: Route-level middleware protection for authenticated endpoints

### AI Integration
- **Provider**: OpenAI GPT-4o model for conversation analysis
- **Processing**: Structured prompt engineering to extract:
  - Interest level classification (hot/warm/cold)
  - Potential objections with intensity levels
  - Strategic follow-up advice
  - Generated email subject and message content
- **Response Handling**: JSON-structured responses for consistent data parsing

### Payment Processing
- **Provider**: Stripe for subscription management
- **Integration**: React Stripe.js for frontend payment forms
- **Features**: Premium subscription with usage limits for free users
- **Billing Model**: Monthly subscription with analysis count tracking

### Development Architecture
- **Monorepo Structure**: Shared types and schemas between client and server
- **Build Process**: Vite for client bundling, esbuild for server compilation
- **Development Tools**: Hot reload in development, TypeScript compilation checking
- **Path Aliases**: Configured for clean imports across client, server, and shared code

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting for data persistence
- **OpenAI API**: GPT-4o model for conversation analysis and insight generation
- **Stripe**: Payment processing and subscription management
- **Replit Auth**: User authentication and session management

### Frontend Libraries
- **shadcn/ui**: Complete UI component library built on Radix UI
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Hook Form**: Form validation and state management
- **Wouter**: Lightweight routing library

### Backend Libraries
- **Drizzle ORM**: Type-safe database operations and migrations
- **Express.js**: Web application framework
- **Passport.js**: Authentication middleware with OpenID Connect strategy
- **connect-pg-simple**: PostgreSQL session store for Express

### Development Tools
- **Vite**: Frontend build tool with hot module replacement
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds
- **Drizzle Kit**: Database schema management and migration tools