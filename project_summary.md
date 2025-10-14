
# Project Apex: Technical Overview

## 1. Project Description

Project Apex is an advanced sports betting analytics platform. It leverages machine learning to provide predictions and identify value betting opportunities across various sports leagues.

## 2. Core Technologies

- **Framework:** Next.js (v15)
- **Language:** TypeScript
- **UI/Styling:**
    - Tailwind CSS
    - Radix UI for accessible, unstyled components
    - `lucide-react` for icons
    - `recharts` for data visualization and charts
- **State Management/Data Fetching:**
    - React Hooks/Context (`AuthProvider`, `RealTimeProvider`)
    - Server-side data fetching in Next.js
- **Forms:** `react-hook-form` with `zod` for validation
- **Backend/Database:** Supabase (Authentication, Database, Real-time)
- **Testing:**
    - Jest for unit and integration tests
    - Playwright for end-to-end (E2E) tests
- **Code Quality:**
    - ESLint for linting
    - Prettier for code formatting
    - TypeScript for static type checking

## 3. Project Structure

The project follows a standard Next.js `app` directory structure.

- **`app/`**: Contains the application's routes and UI.
    - **`layout.tsx`**: The root layout, which sets up global providers like `ThemeProvider`, `AuthProvider`, and `ErrorBoundary`.
    - **`page.tsx`**: The main entry point for the homepage.
    - **`api/`**: API routes for backend functionality.
- **`components/`**: Reusable React components.
    - **`auth/`**: Authentication-related components (`AuthGuard`).
    - **`layout/`**: Layout components (`AppLayout`).
    - **`homepage/`**: Components specific to the homepage (`LiveGamesHero`, `PredictionsDashboard`).
    - **`ui/`**: Generic UI elements.
- **`lib/`**: Core application logic, services, and utilities.
    - **`auth/`**: Authentication context and logic.
    - **`data/`**: Data fetching and management.
    - **`supabase/`**: Supabase client and configuration.
- **`hooks/`**: Custom React hooks.
- **`tests/`**: Contains all tests (unit, integration, E2E).
- **`scripts/`**: Utility scripts for tasks like database setup and data population.

## 4. Configuration

- **`next.config.mjs`**:
    - Heavily optimized for performance (code splitting, compression, optimized image loading).
    - Configured for remote image sources (NBA, ESPN).
    - Strict ESLint and TypeScript rules enforced during builds.
- **`package.json`**:
    - Defines all project dependencies and scripts.
    - Includes a comprehensive set of scripts for development, testing, and deployment.
- **`tsconfig.json`**: Configures the TypeScript compiler.

## 5. Key Features & Functionality

- **User Authentication:** Users must log in to access the platform, managed via Supabase Auth.
- **Real-time Data:** The application displays real-time sports data, likely powered by Supabase Realtime or WebSockets.
- **Sports Analytics Dashboard:** The homepage presents a comprehensive dashboard with:
    - Live game information.
    - ML-driven predictions.
    - Analytics overviews.
    - A grid of sports data.
- **Multi-Sport Support:** The platform is designed to support multiple sports, with a `SportSelector` component.
- **Performance Optimized:** The application is built with performance in mind, utilizing Next.js features and best practices.
- **Comprehensive Testing:** The project has a robust testing strategy, covering all levels of the application from unit to E2E.

