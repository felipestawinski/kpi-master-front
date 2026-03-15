# KPI Master — Frontend Instructions

> **KPI Master** is a sports data management and analysis platform. Users upload CSV files (stored on IPFS), then ask questions and generate visual insights via an AI-powered chat interface. The UI is entirely in **Portuguese (pt-BR)**.

---

## Tech Stack

| Layer          | Technology                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| Framework      | **Next.js 15** (App Router) with `reactStrictMode: false`                  |
| Language       | **TypeScript 5.8** (strict mode, `ES2017` target, bundler module resolution) |
| UI Library     | **React 19**                                                               |
| Styling        | **Tailwind CSS v4** + `tw-animate-css`, custom CSS animations in `globals.css` |
| Component Kit  | **shadcn/ui** (new-york style, lucide icons, CSS variables, RSC enabled)   |
| Markdown       | **react-markdown** for rendering AI chat responses                         |
| Icons          | **lucide-react** + **react-icons** (Fa, Md, Io5, Cg, Pi icon sets)        |
| 3D             | **@react-three/fiber** + **three.js** (used for lobby visuals)             |
| Fonts          | **Roboto** (primary body), Geist Sans/Mono (CSS variables), Inter, Poppins available |
| Linting        | ESLint 9 flat config (`next/core-web-vitals` + `next/typescript`)          |
| Backend        | External Go/Java API at `http://localhost:8080` (not in this repo)         |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout: Roboto font, LoadingProvider
│   ├── globals.css             # Tailwind imports, CSS variables (oklch), animations
│   ├── page.tsx                # Root redirect
│   ├── error.tsx               # Error boundary
│   ├── not-found.tsx           # 404 page
│   ├── global-error.tsx        # Global error boundary
│   │
│   ├── (public)/               # Unauthenticated routes
│   │   ├── lobby/page.tsx      # Landing page (Header, About, IPFS, DataAnalysis)
│   │   ├── login/page.tsx      # Login form → POST /login
│   │   └── register/page.tsx   # Registration form → POST /register
│   │
│   └── (app)/                  # Authenticated routes (sidebar layout)
│       ├── layout.tsx          # App shell: Sidebar + FinisherHeader animated canvas
│       ├── main/page.tsx       # Dashboard home + OnboardingAssistant
│       ├── chat/page.tsx       # AI chat: select file → ask questions → POST /analysis-gen
│       ├── upload/page.tsx     # File upload with drag-and-drop → POST /upload (IPFS)
│       ├── search/page.tsx     # Search files by name/institution/writer → POST /search-file
│       ├── users/page.tsx      # User management table → GET /users
│       ├── profile/page.tsx    # User profile + profile picture upload
│       └── statistics/page.tsx # Placeholder ("Em construção")
│
├── components/
│   ├── AuthGuard.tsx           # Client-side JWT auth guard (localStorage)
│   ├── Sidebar.tsx             # Navigation sidebar with loading transitions
│   ├── Header.tsx              # Landing page header
│   ├── About.tsx               # Landing "about" section
│   ├── IPFS.tsx                # Landing IPFS explanation section
│   ├── DataAnalysis.tsx        # Landing data analysis section
│   ├── ChartGuidePopup.tsx     # Chart generation guidance popup
│   ├── OnboardingAssistant.tsx # New user onboarding flow
│   ├── LoadingPopup.tsx        # Full-screen loading overlay
│   ├── Silk.jsx                # Silk canvas animation (JSX)
│   │
│   └── hooks/
│       ├── useLoading.tsx      # LoadingContext provider + hook
│       └── useScrollAnimation.ts # IntersectionObserver-based scroll-triggered animations
│
└── lib/
    └── utils.ts                # cn() utility (clsx + tailwind-merge)
```

---

## Path Aliases

```
@/* → ./src/*
```

Configured in `tsconfig.json` and used throughout the codebase.

---

## Authentication

- **Mechanism**: JWT token stored in `localStorage` under the key `token`.
- **Guard**: `AuthGuard` component wraps all `(app)` pages. It reads the token, decodes the payload with `atob`, and checks `exp` against current time.
- **Login response** stores: `token`, `username`, `institution`, `role`, `profileImageUrl`, `email` in localStorage.
- **Logout**: Removes `token` from localStorage and redirects to `/login`.
- **Authorization header**: Sent as `Authorization: <token>` (no "Bearer" prefix).

### Protected Page Pattern

```tsx
export default function ProtectedSomePage() {
  return (
    <AuthGuard>
      <SomePage />
    </AuthGuard>
  );
}
```

---

## Backend API Endpoints

All requests go to `http://localhost:8080`. Auth token is sent via `Authorization` header.

| Method | Endpoint           | Body / Params                                                              | Description                                       |
| ------ | ------------------ | --------------------------------------------------------------------------- | ------------------------------------------------- |
| POST   | `/login`           | `{ email, password }`                                                       | Returns `{ token, username, institution, role, … }` |
| POST   | `/register`        | `{ email, password, username, institution, role, accessType }`             | Creates a new user account                        |
| POST   | `/upload`          | `FormData: file, filename, institution` + `Authorization` header           | Uploads file to IPFS                              |
| POST   | `/files`           | `{ username }` + `Authorization` header                                    | Lists all files for a user                        |
| POST   | `/search-file`     | `{ searchType, searchTerm }` + `Authorization` header                      | Searches files by filename, institution, or writer |
| POST   | `/analysis-gen`    | `{ fileIds: number[], prompt: string }` + `Authorization` header           | AI analysis; returns `{ text_response, image?, hasImage }` |
| POST   | `/statistics-gen`  | `{ image }` + `Authorization` header                                       | Saves analysis image to statistics                |
| POST   | `/upload-picture`  | `FormData: file` + `Authorization` header                                  | Uploads profile picture                           |

### Common Data Types

```typescript
type ApiFile = {
  id: number;
  filename: string;
  institution: string;
  writer: string;
  date: string;       // "YYYY-MM-DD HH:mm:ss"
  fileAddress: string; // IPFS URL
};

type ApiUser = {
  id: number;
  email: string;
  username: string;
  institution: string;
};
```

---

## Design System & Styling

### Color Palette

- **Primary accent**: Amber/Orange gradient (`from-amber-500 to-amber-600`, `from-orange-500 to-orange-600`)
- **Dark background**: `#0f172a` (app shell), `#1e2938` (login/lobby sections)
- **Glass cards**: `bg-black/40 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl`
- **Text on dark**: `text-white`, `text-white/80`, `text-gray-300`
- **CSS variables** use `oklch` color space (shadcn/ui defaults in `globals.css`)
- **Custom Tailwind colors**: `primary-50` through `primary-900` (amber scale)

### Design Patterns

1. **Glassmorphism**: Cards use `backdrop-blur-xl bg-black/40 border-white/30` pattern extensively
2. **Animated backgrounds**: FinisherHeader canvas with particle effects in `(app)/layout.tsx`
3. **Scroll animations**: `useScrollAnimation` hook triggers fade/slide on visibility via IntersectionObserver
4. **Loading states**: `LoadingProvider` context + `LoadingPopup` component for navigation transitions
5. **CSS animation classes**: Defined in `globals.css` — `animate-fade-in-up`, `animate-slide-in-left`, `animate-float-glow`, etc., with staggered `animation-delay-*` utilities
6. **Drop shadows on text**: `drop-shadow-lg` / `drop-shadow-2xl` used on text over translucent backgrounds

### Component Conventions

- All page components are `'use client'` (client components)
- Protected pages export a `ProtectedXxxPage` default that wraps the actual page in `<AuthGuard>`
- Inline `<style jsx global>` blocks are used for page-specific keyframe animations
- Icons come from both `lucide-react` and `react-icons` — prefer `lucide-react` for consistency
- Button style: `bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg`

---

## Key Features

### 1. File Upload (IPFS)
- Drag-and-drop zone with file preview
- Files are sent to backend which stores them on IPFS (InterPlanetary File System)
- Each file gets a unique `fileAddress` (IPFS gateway URL)
- Metadata includes: filename, institution, writer (uploader), date

### 2. AI Chat Analysis
- User selects a file (single) or an institution (multi-file) to analyze
- Sends a prompt + file IDs to `/analysis-gen`
- Backend processes the CSV data and returns:
  - `text_response`: Markdown-formatted analysis
  - `image` (optional): Base64-encoded chart image
- Chat history persisted in `localStorage` per file/institution
- Customizable template questions stored in localStorage
- Supports `ChartGuidePopup` for chart generation guidance

### 3. File Search
- Search by filename, institution, or writer via `/search-file`
- Results displayed in a styled table with file links
- Can download and save analysis images

### 4. User Management
- Lists all users with email, username, institution
- Data fetched from `/users` endpoint

### 5. Profile
- Displays user info (email, username, institution, role, access type)
- Profile picture upload functionality

---

## Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

> **Note**: The backend API must be running at `http://localhost:8080` for the app to function. The backend is not included in this repository.

---

## Coding Standards

1. **TypeScript**: Strict mode enabled. Use explicit types for props, state, and API responses. Inline `type` declarations are used alongside components (e.g., `type ApiFile = {...}` at the top of files).
2. **Components**: Functional components with hooks. No class components. Use `'use client'` directive for all interactive pages.
3. **Naming**: PascalCase for components, camelCase for variables/functions. Page files are always `page.tsx` (Next.js convention).
4. **Styling**: Tailwind utility classes inline. No separate CSS modules. Complex animations defined in `globals.css` or inline `<style jsx global>`.
5. **State management**: React `useState` + `useContext` (LoadingContext). No external state libraries. localStorage for persistence (auth tokens, chat history, template questions).
6. **Error handling**: Try-catch blocks with `alert()` for user-facing errors. Console.error for logging.
7. **File organization**: Pages in `src/app/` (App Router), reusable components in `src/components/`, hooks in `src/components/hooks/`, utilities in `src/lib/`.
8. **API calls**: Direct `fetch()` calls within components. No abstraction layer or API client. Token passed via `Authorization` header.
9. **Language**: All user-facing text is in **Portuguese (pt-BR)**. Keep this convention when adding new features.
10. **shadcn/ui**: Use `cn()` from `@/lib/utils` for conditional class merging. Follow the new-york style variant.

---

## Important Files Quick Reference

| File                                 | Purpose                                      |
| ------------------------------------ | -------------------------------------------- |
| `src/app/globals.css`                | Global styles, CSS vars, animation keyframes |
| `src/app/layout.tsx`                 | Root layout with font + LoadingProvider      |
| `src/app/(app)/layout.tsx`           | Auth app shell (sidebar, animated bg)        |
| `src/components/AuthGuard.tsx`       | JWT auth guard for protected routes          |
| `src/components/Sidebar.tsx`         | Main navigation sidebar                      |
| `src/components/hooks/useLoading.tsx`| Global loading state context                 |
| `src/lib/utils.ts`                  | `cn()` utility for class merging             |
| `tailwind.config.js`                | Custom colors, animations, keyframes         |
| `components.json`                   | shadcn/ui configuration                      |
