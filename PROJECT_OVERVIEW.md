# Project Apex: Technical Overview

## 1. Project Description

Project Apex is an advanced sports betting analytics platform named "ApexBets". It leverages machine learning to provide predictions and identify value betting opportunities across various sports leagues.

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
- **`lib/`**: Core application logic, services, and utilities.
    - **`services/`**: A large number of services that encapsulate business logic.
    - **`sports-apis/`**: Clients for external sports APIs.
    - **`database/`**: Database-related services and queries.
    - **`ml/`**: Machine learning related code.
- **`hooks/`**: Custom React hooks.
- **`tests/`**: Contains all tests (unit, integration, E2E).
- **`scripts/`**: Utility scripts for tasks like database setup and data population.

## 4. Key Features & Functionality

- **User Authentication:** Users must log in to access the platform, managed via Supabase Auth.
- **Real-time Data:** The application displays real-time sports data, powered by Supabase Realtime and Server-Sent Events (SSE).
- **Sports Analytics Dashboard:** The homepage presents a comprehensive dashboard with live game information, ML-driven predictions, and analytics overviews.
- **Multi-Sport Support:** The platform is designed to support multiple sports with a dynamic, sport-agnostic architecture.
- **Performance Optimized:** The application is built with performance in mind, utilizing Next.js features, a multi-layer caching strategy (in-memory and database), and other best practices.
- **Comprehensive Testing:** The project has a robust testing strategy, covering all levels of the application from unit to E2E, although coverage needs improvement.
- **Robust Error Handling:** The application has a sophisticated error handling system with circuit breakers, retry logic, and structured logging.
- **External API Integration:** The platform integrates with multiple external sports data APIs with a fallback strategy and cost management.

## 5. Known Issues & Limitations

- **API Endpoint Issues:**
    - `/api/analytics/team-performance`: Returns a 404 error.
    - `/api/analytics/trends`: Experiences timeouts.
- **Testing:** Test coverage is a known weakness and needs improvement.
- **Documentation:** Some documentation gaps exist, including the lack of an OpenAPI/Swagger specification.
