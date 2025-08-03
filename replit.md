# LeadMirror

## Overview

LeadMirror is the world's most advanced SaaS application for analyzing commercial conversations using revolutionary AI technology. The application provides comprehensive sales conversation analysis with advanced psychological profiling, competitive intelligence, and predictive analytics. Built with cutting-edge AI capabilities including:

- **Deep Psychological Analysis**: Personality profiling, emotional state detection, and behavioral pattern recognition
- **Advanced Sales Intelligence**: Conversation quality scoring, sales timing optimization, and closing probability predictions
- **Competitive Analysis**: Automatic competitor detection, threat assessment, and strategic counter-measures
- **Predictive AI**: Objection prediction, next-step recommendations, and risk factor identification
- **Emotional Journey Mapping**: Real-time sentiment analysis and emotional trigger detection

The platform combines the expertise of top sales methodologies with advanced AI to provide unprecedented insights into sales conversations, making it the definitive tool for sales professionals, coaches, and commercial teams worldwide.

## User Preferences

Preferred communication style: Simple, everyday language.
Language: French language support implemented throughout the application interface.

## Recent Changes (January 2025)

### Authentication System Migration
- **Date**: January 3, 2025
- **Change**: Migrated from Google OAuth to simple email/password authentication
- **Reason**: Simplified user onboarding without requiring external OAuth setup
- **Implementation**: Added bcrypt password hashing, email/password forms, session management

### Lifetime Offer Launch
- **Date**: January 3, 2025
- **Change**: Introduced exclusive lifetime offer for first 50 users
- **Pricing**: €99 one-time payment for lifetime access (vs €15/month regular pricing)
- **Features**: Landing page redesign, dedicated offer page, Stripe Checkout integration
- **Marketing**: Urgency-driven messaging with countdown timer and limited availability

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
- **Provider**: Simple email/password authentication system
- **Password Security**: bcrypt hashing for secure password storage
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple
- **User Management**: Manual user registration and login with form validation
- **Authorization**: Session-based middleware protection for authenticated endpoints

### Revolutionary AI Integration
- **Primary AI**: OpenAI GPT-4o model with advanced prompt engineering for world-class analysis
- **Multi-Layer Analysis System**:
  - **Core Analysis**: Interest level, objections, strategic advice, follow-up generation
  - **Psychological Profiling**: DISC personality analysis, communication style detection, behavioral traits
  - **Emotional Intelligence**: Sentiment tracking, emotional state detection, trigger identification
  - **Predictive Analytics**: Closing probability, objection prediction, timing optimization
  - **Competitive Intelligence**: Competitor detection, threat assessment, advantage identification
  - **Advanced Insights**: Conversation quality scoring, prospect maturity assessment, key moment detection
- **Triple-AI Architecture**: 
  - Primary conversation analysis
  - Advanced insights generation
  - Emotional journey mapping
- **Response Handling**: Multi-structured JSON responses with comprehensive validation

### Payment Processing
- **Provider**: Stripe for subscription management and lifetime offer
- **Integration**: React Stripe.js for frontend payment forms and Checkout sessions
- **Lifetime Offer**: Exclusive launch offer at €99 for lifetime access (limited to 50 users)
- **Features**: Premium subscription with usage limits for free users (3 analyses/month)
- **Billing Model**: 
  - Launch offer: €99 one-time payment for lifetime access
  - Regular pricing: €15/month after launch offer ends

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

### SEO & Accessibility Optimization (Janvier 2025)
- **Référencement naturel complet**: Meta tags optimisés, JSON-LD Schema.org, sitemap.xml
- **Accessibilité web**: Attributs ARIA, navigation sémantique, support lecteurs d'écran
- **Performance**: Preconnect, DNS prefetch, manifeste web pour PWA
- **Découvrabilité moteurs**: Robots.txt optimisé, méta géo-targeting France
- **Standards internationaux**: Lang tags français, conformité WCAG

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