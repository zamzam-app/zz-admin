# Admin Dashboard - Review & Analytics System

This is the administrative dashboard for managing outlets, users, forms, and viewing analytics for the review system.

## Tech Stack

- **React** with **TypeScript**
- **Vite** for build and development
- **Tailwind CSS** for styling
- **Ant Design** & **Material UI** for UI components
- **TanStack React Query** for data fetching and state management
- **Axios** for API communication
- **Lucide React** for iconography

## Key Features

- **Overview**: High-level metrics and recent activity across all outlets.
- **Analytics**: Detailed breakdown of performance metrics (Staff, Speed, Cleanliness, Quality).
- **Reviews**: Centralized view of all customer feedback with filtering capabilities.
- **Infrastructure**: Management of physical outlets, including QR code generation and table configuration.
- **Managers**: User management for staff and administrators.
- **Form Builder**: Customizable review forms tailored to different outlet types.
- **Studio**: Digital asset management and configuration.

## Project Structure

- `src/components`: Reusable UI components and layouts.
- `src/lib`: Core logic including API services, context providers, and utility functions.
- `src/pages`: Main application views.
- `src/routes`: Routing configuration and navigation guards.
- `src/theme`: Material UI theme and component configurations.

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm run dev
```

### Build

```bash
pnpm run build
```

### Type Check

```bash
pnpm check-types
```

## Auth Flow

The application uses a centralized authentication storage module (`src/lib/auth/auth-storage.ts`) to manage session state. Authentication state is exposed via the `useAuth` hook from `AuthContext`. API requests are automatically intercepted to include the bearer token.
