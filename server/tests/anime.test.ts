import { describe, it, expect, beforeAll, afterAll, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { setupRoutes } from '../routes';
import fetch from 'node-fetch';

// Mock modules
vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

// Mock user for authentication tests
const mockUser = {
  id: '12345',
  username: 'testuser',
  anilistId: '12345',
  accessToken: 'mock-token'
};

// Sample AniList response
const mockAniListResponse = {
  data: {
    MediaListCollection: {
      lists: [
        {
          status: 'CURRENT',
          entries: [
            {
              id: 123,
              status: 'CURRENT',
              progress: 5,
              media: {
                id: 456,
                title: {
                  english: 'Test Anime',
                  romaji: 'Tesuto Anime'
                },
                episodes: 12,
                status: 'RELEASING',
                nextAiringEpisode: {
                  airingAt: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
                  episode: 6,
                  timeUntilAiring: 86400
                }
              }
            }
          ]
        }
      ]
    }
  }
};

describe('Anime API Routes', () => {
  let app: express.Application;
  let server: any;

  beforeAll(() => {
    // Setup express app for testing
    app = express();
    
    // Setup session middleware (memory store for testing)
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    
    // Initialize passport
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Mock passport serialization/deserialization
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });
    
    passport.deserializeUser((id: string, done) => {
      if (id === mockUser.id) {
        done(null, mockUser);
      } else {
        done(new Error('User not found'), null);
      }
    });
    
    // Setup routes
    setupRoutes(app);
  });

  afterAll((done) => {
    if (server) server.close(done);
    else done();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Test /api/anime/airing endpoint when user is not authenticated
  it('should return 401 for /api/anime/airing when not authenticated', async () => {
    const response = await request(app).get('/api/anime/airing');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Not authenticated');
  });

  // Test /api/anime/airing endpoint when user is authenticated
  it('should return anime data for /api/anime/airing when authenticated', async () => {
    // Mock the fetch response
    (fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAniListResponse
    });
    
    const agent = request.agent(app);
    
    // Manually set the user in the session
    await new Promise<void>((resolve) => {
      agent.get('/').end((err, res) => {
        const req = res.request;
        (req as any).session.passport = { user: mockUser.id };
        (req as any).session.save(() => {
          resolve();
        });
      });
    });
    
    const response = await agent.get('/api/anime/airing');
    
    expect(response.status).toBe(200);
    expect(response.body.type).toBe('airing_update');
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data).toHaveLength(1);
    
    const firstShow = response.body.data[0];
    expect(firstShow.id).toBe(456);
    expect(firstShow.title).toBe('Test Anime');
    expect(firstShow.nextAiringEpisode).toBeDefined();
    expect(firstShow.nextAiringEpisode.episode).toBe(6);
  });

  // Test /api/anime/airing endpoint when AniList API fails
  it('should handle AniList API errors gracefully', async () => {
    // Mock the fetch response to simulate an error
    (fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });
    
    const agent = request.agent(app);
    
    // Manually set the user in the session
    await new Promise<void>((resolve) => {
      agent.get('/').end((err, res) => {
        const req = res.request;
        (req as any).session.passport = { user: mockUser.id };
        (req as any).session.save(() => {
          resolve();
        });
      });
    });
    
    const response = await agent.get('/api/anime/airing');
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to fetch airing anime');
  });
});
