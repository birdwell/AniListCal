# Production Deployment Checklist

## Pre-Deployment

- [ ] Set up a strong `SESSION_SECRET` in your production environment
- [ ] Configure proper AniList OAuth credentials for production
- [ ] Ensure database connection string is correct for production
- [ ] Update CORS settings with your production domain
- [ ] Verify Content Security Policy settings are appropriate for your domain
- [ ] Set `NODE_ENV=production` in your deployment environment

## Build Process

- [ ] Run `yarn build` to create production bundles without source maps
- [ ] Verify the build completes successfully
- [ ] Check that all static assets are correctly bundled

## Deployment

- [ ] Deploy the application to your production environment
- [ ] Set up environment variables on your production server
- [ ] Configure a process manager (like PM2) to keep the app running
- [ ] Set up HTTPS with a valid SSL certificate
- [ ] Configure proper HTTP headers (already handled in code)
- [ ] Set up logging and monitoring

## Post-Deployment Verification

- [ ] Verify the application starts correctly
- [ ] Check the `/api/health` endpoint returns a healthy status
- [ ] Test user authentication flows
- [ ] Verify database connections are working
- [ ] Test core functionality (calendar, show details, etc.)
- [ ] Check for any console errors or warnings

## Security Considerations

- [ ] Ensure all API keys and secrets are properly secured
- [ ] Verify rate limiting is working correctly
- [ ] Check that session cookies are secure and HTTP-only
- [ ] Confirm Content Security Policy is properly enforced
- [ ] Test for common vulnerabilities (XSS, CSRF, etc.)

## Performance Optimization

- [ ] Verify assets are properly compressed
- [ ] Check page load times
- [ ] Consider setting up a CDN for static assets
- [ ] Implement caching strategies where appropriate

## Monitoring and Maintenance

- [ ] Set up uptime monitoring
- [ ] Configure error tracking
- [ ] Set up database backup procedures
- [ ] Create a rollback plan in case of deployment issues
- [ ] Document the deployment process for future reference
