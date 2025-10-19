#!/usr/bin/env node

/**
 * Generate Secure Production Secrets
 *
 * This script generates cryptographically secure secrets for production deployment.
 * Run this before deploying to generate JWT_SECRET and NEXTAUTH_SECRET.
 *
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generating Production Secrets...\n');
console.log('═'.repeat(70));

// Generate JWT Secret (32 bytes = 64 hex characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 JWT_SECRET (for backend):\n');
console.log(jwtSecret);

// Generate NextAuth Secret (32 bytes = 64 hex characters)
const nextAuthSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 NEXTAUTH_SECRET (for frontend):\n');
console.log(nextAuthSecret);

// Generate Admin API Key (optional, for GitHub Actions HTTP trigger)
const adminApiKey = crypto.randomBytes(32).toString('hex');
console.log('\n📝 ADMIN_API_KEY (optional, for GitHub Actions):\n');
console.log(adminApiKey);

console.log('\n' + '═'.repeat(70));
console.log('\n✅ Secrets generated successfully!\n');
console.log('📋 Next steps:\n');
console.log('1. Copy JWT_SECRET to Render.com environment variables');
console.log('2. Copy NEXTAUTH_SECRET to Vercel environment variables');
console.log('3. Copy ADMIN_API_KEY to GitHub Secrets (if using HTTP trigger)\n');
console.log('⚠️  IMPORTANT: Keep these secrets safe and never commit them to git!\n');
