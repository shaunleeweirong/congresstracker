import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../src/config/database';

// This will be replaced with actual app once implemented
let app: Express;

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    // TODO: Initialize test app and database
    // app = createTestApp();
    // await setupTestDatabase();
    
    // Ensure test database is clean
    await db.testConnection();
  });

  afterAll(async () => {
    // TODO: Cleanup test database and close connections
    // await cleanupTestDatabase();
    await db.close();
  });

  beforeEach(async () => {
    // Clear users table before each test to ensure clean state
    await db.query('DELETE FROM users WHERE email LIKE %test%');
  });

  describe('Complete User Registration Flow', () => {
    const testUser = {
      email: 'integration-test@example.com',
      password: 'SecurePassword123!',
      name: 'Integration Test User'
    };

    it('should complete full user registration and login flow', async () => {
      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(201);

      // Verify registration response
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body).toHaveProperty('token');
      expect(registerResponse.body.user.email).toBe(testUser.email);
      expect(registerResponse.body.user.name).toBe(testUser.name);
      expect(registerResponse.body.user.subscriptionStatus).toBe('active');

      // Verify user was created in database
      const dbUser = await db.findByField('users', 'email', testUser.email);
      expect(dbUser).toBeTruthy();
      expect(dbUser.email).toBe(testUser.email);
      expect(dbUser.name).toBe(testUser.name);
      expect(dbUser.subscription_status).toBe('active');

      // Step 2: Login with created user
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify login response
      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user.email).toBe(testUser.email);
      expect(loginResponse.body.user.id).toBe(registerResponse.body.user.id);

      // Step 3: Verify token works for protected endpoints
      const protectedResponse = await request(app)
        .get('/api/v1/search')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .query({ q: 'test' })
        .expect(200);

      expect(protectedResponse.body).toHaveProperty('politicians');
      expect(protectedResponse.body).toHaveProperty('stocks');
    });

    it('should prevent duplicate email registrations', async () => {
      // Register user first time
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      // Attempt to register same email again
      const duplicateResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(duplicateResponse.body).toHaveProperty('error');
      expect(duplicateResponse.body.message).toMatch(/email.*already.*exists/i);
    });

    it('should hash passwords securely', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      // Verify password is not returned in response
      expect(registerResponse.body.user).not.toHaveProperty('password');
      expect(registerResponse.body.user).not.toHaveProperty('passwordHash');

      // Verify password is hashed in database
      const dbUser = await db.findByField('users', 'email', testUser.email);
      expect(dbUser.password_hash).toBeTruthy();
      expect(dbUser.password_hash).not.toBe(testUser.password);
      expect(dbUser.password_hash.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('should update last_login_at on successful login', async () => {
      // Register user
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      // Check last_login_at is null initially
      let dbUser = await db.findByField('users', 'email', testUser.email);
      expect(dbUser.last_login_at).toBeNull();

      // Login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      // Verify last_login_at is updated
      dbUser = await db.findByField('users', 'email', testUser.email);
      expect(dbUser.last_login_at).toBeTruthy();
      
      const loginTime = new Date(dbUser.last_login_at);
      const now = new Date();
      expect(now.getTime() - loginTime.getTime()).toBeLessThan(5000); // Within 5 seconds
    });
  });

  describe('Authentication Token Management', () => {
    let userToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create a test user and get token
      const testUser = {
        email: 'token-test@example.com',
        password: 'TokenPassword123!',
        name: 'Token Test User'
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      userToken = registerResponse.body.token;
      userId = registerResponse.body.user.id;
    });

    it('should validate JWT tokens correctly', async () => {
      // Valid token should work
      const validResponse = await request(app)
        .get('/api/v1/search')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ q: 'test' })
        .expect(200);

      expect(validResponse.body).toHaveProperty('politicians');
    });

    it('should reject invalid JWT tokens', async () => {
      const invalidToken = 'invalid.jwt.token';

      const response = await request(app)
        .get('/api/v1/search')
        .set('Authorization', `Bearer ${invalidToken}`)
        .query({ q: 'test' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject expired JWT tokens', async () => {
      // This would require creating an expired token for testing
      // TODO: Implement when JWT service supports custom expiration for testing
    });

    it('should reject requests without Authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'test' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject malformed Authorization headers', async () => {
      const malformedHeaders = [
        'Bearer', // Missing token
        'InvalidBearer token123', // Wrong format
        userToken, // Missing Bearer prefix
        `Basic ${userToken}`, // Wrong auth type
      ];

      for (const header of malformedHeaders) {
        const response = await request(app)
          .get('/api/v1/search')
          .set('Authorization', header)
          .query({ q: 'test' })
          .expect(401);

        expect(response.body).toHaveProperty('error');
      }
    });

    it('should include user context in authenticated requests', async () => {
      // Create an alert to verify user context is properly set
      const alertData = {
        alertType: 'stock',
        tickerSymbol: 'AAPL'
      };

      const alertResponse = await request(app)
        .post('/api/v1/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(alertData)
        .expect(201);

      // Verify alert is created for the correct user
      const dbAlert = await db.findById('user_alerts', alertResponse.body.id);
      expect(dbAlert.user_id).toBe(userId);
    });
  });

  describe('Password Security', () => {
    it('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        '123', // Too short
        'password', // Too simple
        '12345678', // No letters
        'ABCDEFGH', // No numbers or lowercase
        'abcdefgh', // No numbers or uppercase
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `test-${Math.random()}@example.com`,
            password,
            name: 'Test User'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.message).toMatch(/password/i);
      }
    });

    it('should accept strong passwords', async () => {
      const strongPassword = 'StrongPassword123!@#';

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'strong-password-test@example.com',
          password: strongPassword,
          name: 'Strong Password User'
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
    });

    it('should reject login with incorrect password', async () => {
      const testUser = {
        email: 'password-fail-test@example.com',
        password: 'CorrectPassword123!',
        name: 'Password Fail Test'
      };

      // Register user
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      // Try to login with wrong password
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/invalid.*credentials/i);
    });
  });

  describe('User Account Management', () => {
    it('should create user with default subscription status', async () => {
      const testUser = {
        email: 'default-status-test@example.com',
        password: 'DefaultStatus123!',
        name: 'Default Status User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.user.subscriptionStatus).toBe('active');

      // Verify in database
      const dbUser = await db.findByField('users', 'email', testUser.email);
      expect(dbUser.subscription_status).toBe('active');
    });

    it('should handle user data validation', async () => {
      const invalidUserData = [
        {
          // Missing email
          password: 'ValidPassword123!',
          name: 'Test User'
        },
        {
          email: 'invalid-email', // Invalid email format
          password: 'ValidPassword123!',
          name: 'Test User'
        },
        {
          email: 'valid@example.com',
          // Missing password
          name: 'Test User'
        },
        {
          email: 'valid@example.com',
          password: 'ValidPassword123!',
          // Missing name
        }
      ];

      for (const userData of invalidUserData) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Database Transaction Integrity', () => {
    it('should rollback registration on database errors', async () => {
      // This test would require simulating database errors
      // TODO: Implement when error simulation is available
    });

    it('should handle concurrent registration attempts gracefully', async () => {
      const testUser = {
        email: 'concurrent-test@example.com',
        password: 'ConcurrentTest123!',
        name: 'Concurrent Test User'
      };

      // Attempt multiple concurrent registrations with same email
      const promises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/register')
          .send(testUser)
      );

      const results = await Promise.allSettled(promises);
      
      // Only one should succeed (201), others should fail (400)
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 201);
      const failed = results.filter(r => r.status === 'fulfilled' && r.value.status === 400);

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(4);
    });
  });
});