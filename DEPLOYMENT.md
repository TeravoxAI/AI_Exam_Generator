# Vercel Deployment Guide

This guide will help you deploy both the FastAPI backend and React frontend on Vercel.

## Prerequisites

- Vercel account
- GitHub repository connected to Vercel
- Environment variables ready

## Project Structure

```
AI_Exam_Generator/
├── api/
│   └── index.py          # Vercel serverless function entry point
├── frontend/             # React + Vite frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── src/                  # FastAPI backend source
├── app.py               # Local development entry point
├── requirements.txt      # Python dependencies
├── vercel.json          # Vercel configuration
└── .vercelignore        # Files to exclude from deployment
```

## Deployment Steps

### 1. Environment Variables

In your Vercel project dashboard, add these environment variables:

#### Required:
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon/service key
- `JWT_SECRET` - Secret key for JWT authentication
- `JWT_ALGORITHM` - Usually `HS256`

#### Optional:
- `VITE_API_URL` - Leave empty for production (uses same domain)

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Add environment variables in the settings
6. Click "Deploy"

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# For production deployment
vercel --prod
```

### 3. Configure Custom Domain

1. In Vercel project dashboard, go to **Settings → Domains**
2. Add your domain: `exams.teravox.ai`
3. Follow Vercel's DNS configuration instructions
4. Wait for DNS propagation (usually 5-10 minutes)

## How It Works

### Backend Routing

The FastAPI backend is deployed as serverless functions. API routes are configured in `vercel.json`:

```json
{
  "routes": [
    {
      "src": "/(auth|fetch-content|generate-exam|generate-exam-questions|docs|openapi.json)(.*)",
      "dest": "api/index.py"
    }
  ]
}
```

Available endpoints:
- `/auth/signup` - User registration
- `/auth/login` - User login
- `/fetch-content` - Fetch textbook content
- `/generate-exam` - Generate exam structure
- `/generate-exam-questions` - Generate exam questions (protected)
- `/docs` - FastAPI documentation
- `/openapi.json` - OpenAPI schema

### Frontend Routing

All other routes are served by the frontend React app. The `vercel.json` configuration ensures:
1. API routes go to the backend
2. Everything else goes to the frontend
3. Frontend handles client-side routing

### API Base URL

In production:
- Frontend uses relative URLs (empty `VITE_API_URL`)
- Both frontend and backend are on the same domain
- No CORS issues

## Troubleshooting

### Build Fails

**Frontend build errors:**
```bash
cd frontend
npm install
npm run build
```

**Backend import errors:**
Check that all dependencies are in `requirements.txt`

### API Routes Not Working

1. Check environment variables are set in Vercel
2. Check function logs in Vercel dashboard
3. Ensure `api/index.py` is importing the app correctly

### CORS Errors

- Should not occur since frontend and backend are on same domain
- If testing locally with different ports, use the proxy in `vite.config.ts`

### Cold Start Issues

Vercel serverless functions have cold starts. First request might be slow (3-5s).
Subsequent requests are fast.

## Local Development

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables in .env
cp .env.example .env

# Run backend
python app.py
# Backend runs on http://localhost:8000
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Set environment variables in frontend/.env
# VITE_API_URL=http://localhost:8000

# Run frontend
npm run dev
# Frontend runs on http://localhost:3000
```

## Monitoring

- **Vercel Dashboard**: View deployment logs and function logs
- **Function Logs**: See API request logs in real-time
- **Analytics**: Track performance metrics

## Cost Considerations

- Vercel free tier includes:
  - 100GB bandwidth
  - 100GB-hours serverless function execution
  - Unlimited deployments

- Backend serverless functions consume execution time
- LLM API calls (OpenRouter) are billed separately

## Security

- Environment variables are encrypted by Vercel
- JWT tokens for authentication
- HTTPS enabled by default
- Secure cookie handling for auth

## Next Steps

After deployment:
1. Test all endpoints
2. Monitor function logs
3. Set up custom domain
4. Configure authentication flow
5. Test exam generation end-to-end

## Support

For issues:
- Check Vercel function logs
- Review FastAPI docs at `/docs` endpoint
- Check backend logs in `logs/` directory (local only)
