# AniListCal

A web application that integrates with AniList to create calendar events for your anime watching schedule.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

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
# Server Settings
NODE_ENV=development
# Optional: Specify a port for the server if needed, defaults to 3000
# PORT=3000

# AniList OAuth Credentials (obtain from AniList API settings)
# Used by the server for token exchange
ANILIST_CLIENT_ID=your_anilist_client_id
ANILIST_CLIENT_SECRET=your_anilist_client_secret

# Used by the client-side Vite build (must be prefixed with VITE_)
VITE_ANILIST_CLIENT_ID=your_anilist_client_id
```

4. Push the database schema:
``