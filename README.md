# AniListCal

A web application that integrates with AniList to create calendar events for your anime watching schedule.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager
- A PostgreSQL database (using Neon Database)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/AniListCal.git
cd AniListCal
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
Create a `.env` file in the root directory with the following variables (adjust values as needed):
```env
DATABASE_URL=your_neon_database_url
NODE_ENV=development
```

4. Push the database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will start in development mode:
- Frontend will be available at `http://localhost:5173`
- Backend API will be running at `http://localhost:3000`

## Project Structure

- `/client` - Frontend React application
- `/server` - Express.js backend server
- `/shared` - Shared types and utilities
- `/drizzle.config.ts` - Database configuration
- `/vite.config.ts` - Vite configuration for the frontend

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Run the production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## Technology Stack

- **Frontend**:
  - React
  - TypeScript
  - Vite
  - Radix UI Components
  - Tailwind CSS

- **Backend**:
  - Express.js
  - TypeScript
  - Drizzle ORM
  - PostgreSQL (Neon Database)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
