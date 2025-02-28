import { describe, it, expect, beforeAll, afterAll, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupRoutes } from '../routes';
import { OpenAI } from 'openai';

// Mock the OpenAI module
vi.mock('openai', () => {
  const MockOpenAI = vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }));
  
  return { OpenAI: MockOpenAI };
});

describe('AI Recommendation API Routes', () => {
  let app: express.Application;
  let server: any;
  
  beforeAll(() => {
    // Setup express app for testing
    app = express();
    app.use(express.json());
    
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

  // Test /api/ai/recommend endpoint with valid input
  it('should return recommendations when given valid shows', async () => {
    // Mock OpenAI response
    const mockOpenAIResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              recommendations: [
                {
                  title: 'Fullmetal Alchemist: Brotherhood',
                  reason: 'Based on your preference for action and adventure themes.'
                },
                {
                  title: 'Steins;Gate',
                  reason: 'You seem to enjoy sci-fi anime with complex narratives.'
                },
                {
                  title: 'Hunter x Hunter',
                  reason: 'This matches your interest in character-driven stories with unique power systems.'
                }
              ]
            })
          }
        }
      ]
    };
    
    // Manually mock the OpenAI instance
    const openaiInstance = new OpenAI();
    (openaiInstance.chat.completions.create as any).mockResolvedValueOnce(mockOpenAIResponse);
    
    // Send request with valid shows array
    const response = await request(app)
      .post('/api/ai/recommend')
      .send({ shows: ['Attack on Titan', 'Demon Slayer', 'My Hero Academia'] });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('recommendations');
    expect(response.body.recommendations).toBeInstanceOf(Array);
    expect(response.body.recommendations).toHaveLength(3);
    
    // Check the first recommendation
    const firstRec = response.body.recommendations[0];
    expect(firstRec).toHaveProperty('title');
    expect(firstRec).toHaveProperty('reason');
    expect(firstRec.title).toBe('Fullmetal Alchemist: Brotherhood');
  });

  // Test /api/ai/recommend endpoint with invalid input
  it('should return 500 when shows array is empty', async () => {
    const response = await request(app)
      .post('/api/ai/recommend')
      .send({ shows: [] });
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Shows array is required and must not be empty');
  });

  // Test /api/ai/recommend endpoint with no shows array
  it('should return 500 when shows array is missing', async () => {
    const response = await request(app)
      .post('/api/ai/recommend')
      .send({});
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });

  // Test /api/ai/recommend endpoint when OpenAI API fails
  it('should handle OpenAI API errors gracefully', async () => {
    // Manually mock the OpenAI instance to throw an error
    const openaiInstance = new OpenAI();
    (openaiInstance.chat.completions.create as any).mockRejectedValueOnce(
      new Error('OpenAI API error')
    );
    
    // Send request with valid shows array
    const response = await request(app)
      .post('/api/ai/recommend')
      .send({ shows: ['Attack on Titan', 'Demon Slayer', 'My Hero Academia'] });
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('OpenAI API error');
  });
});
