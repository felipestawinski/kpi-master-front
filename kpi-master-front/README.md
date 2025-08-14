# KPI Master Front - Frontend Application

This is the frontend application for the KPI Master system, a platform that stores Key Performance Indicators (KPIs) in an IPFS network and provides exploratory analysis capabilities for these files.

## About the Project

KPI Master Front is a [Next.js](https://nextjs.org) application that serves as the user interface for:
- **KPI Management**: Store and manage Key Performance Indicators
- **IPFS Integration**: Leverage distributed storage for data persistence
- **Data Analysis**: Perform exploratory analysis on stored KPI data
- **User Authentication**: Secure access with JWT-based authentication
- **Multi-institutional Support**: Support for different institutions and organizations

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT tokens
- **Storage**: IPFS network integration
- **UI Components**: Custom React components

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Protected app routes
│   ├── (public)/        # Public routes (login, register)
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page with redirect
│   └── globals.css      # Global styles with Tailwind
└── components/
    └── Sidebar.tsx      # Navigation sidebar component
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kpi-master-front
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables (if applicable):
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Features

### Authentication System
- User registration and login
- JWT token-based authentication
- Institution-based user management
- Automatic token validation and refresh

### Dashboard
- Personalized user dashboard
- Institution-specific data views
- KPI data visualization
- File management interface

### IPFS Integration
- Distributed storage for KPI data
- Decentralized file management
- Data integrity through blockchain principles

## Development

### File Structure
- **Pages**: Located in `src/app/` following Next.js App Router conventions
- **Components**: Reusable UI components in `src/components/`
- **Styling**: Tailwind CSS utilities for responsive design
- **Types**: TypeScript for type safety and better development experience

### Key Routes
- `/` - Home page (redirects to login)
- `/login` - User authentication
- `/register` - User registration
- `/main` - Main dashboard (protected)

### Styling
This project uses [Tailwind CSS](https://tailwindcss.com/) for styling. Key features:
- Utility-first CSS framework
- Responsive design out of the box
- Custom color schemes and components
- Dark/light mode support (if implemented)

## API Integration

The frontend communicates with a backend API for:
- User authentication and authorization
- KPI data management
- IPFS network operations
- Institutional data handling

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Deploy on Vercel
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/docs/) - JavaScript with type syntax
- [IPFS Documentation](https://docs.ipfs.io/) - Learn about distributed storage

## License

This project is part of an academic research on KPI management and IPFS integration.

## Contact

For questions about this project, please contact the development team or refer to the