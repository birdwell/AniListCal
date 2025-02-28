import { describe, it, expect, beforeAll, afterAll, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { setupRoutes } from '../routes';
import * as storage from '../storage';

// Mock the modules we don't want to test directly
vi.mock('node-fetch', async () => {
  const actual = await vi.importActual('node-fetch');
  return {
    ...actual,
    default: vi.fn()
  };
});

vi.mock('openai', () => {
  return {
    OpenAI: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

vi.mock('../storage', () => {
  return {
    getToken: vi.fn(),
    storeToken: vi.fn(),
    removeToken: vi.fn()
  };
});

// Mock user for authentication tests
const mockUser = {
  id: '12345',
  username: 'testuser',
  anilistId: '12345',
  accessToken: 'mock-token'
};

describe('Authentication API Routes', () => {
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

  // Test /api/auth/user endpoint when user is not authenticated
  it('should return 401 for /api/auth/user when not authenticated', async () => {
    const response = await request(app).get('/api/auth/user');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Not authenticated');
  });

  // Test /api/auth/user endpoint when user is authenticated
  it('should return user data for /api/auth/user when authenticated', async () => {
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
    
    const response = await agent.get('/api/auth/user');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: mockUser.id,
      username: mockUser.username,
      anilistId: mockUser.anilistId
    });
  });

  // Test logout endpoint
  it('should logout the user and clear the session', async () => {
    const removeTokenSpy = vi.spyOn(storage, 'removeToken');
    
    // Create an agent to maintain session
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
    
    // Logout request
    const response = await agent.post('/api/auth/logout');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(removeTokenSpy).toHaveBeenCalledWith(mockUser.id);
    
    // Verify user is logged out by checking auth endpoint again
    const authResponse = await agent.get('/api/auth/user');
    expect(authResponse.status).toBe(401);
  });
});
