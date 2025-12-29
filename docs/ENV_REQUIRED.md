# Environment Variables Required & Optional

## Overview

This document describes all environment variables required by the application and the CI/CD pipeline.

---

## Required Variables (Application)

### Supabase Configuration

These variables are **required** for the application to run.

| Variable | Scope | Description | Where to Set | Example |
|----------|-------|-------------|--------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL | `.env.local`, Vercel Env | `https://project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key (frontend) | `.env.local`, Vercel Env | `eyJhbGc...` (long JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | Private | Supabase service role key (backend) | `.env.local`, Vercel Secrets | `eyJhbGc...` (long JWT) |
| `SUPABASE_URL` | Private | Supabase URL (backend, same as `NEXT_PUBLIC_SUPABASE_URL`) | `.env.local`, Vercel Env | `https://project.supabase.co` |

---

## Required Variables (CI/CD)

### GitHub Actions Secrets

These variables are required in **GitHub Repository Secrets** for automated deployment.

| Variable | Description | Monitoring Scope |
|----------|-------------|------------------|
| `VERCEL_TOKEN` | Vercel User/Account Token (permissions to promote/deploy) | Core |
| `VERCEL_ORG_ID` | Vercel Organization ID (found in Vercel Project Settings) | Core |
| `VERCEL_PROJECT_ID` | Vercel Project ID (found in Vercel Project Settings) | Core |
| `SLACK_WEBHOOK_URL` | Check out incoming webhook URL for Slack channel | **Optional** (Monitoring) |

> [!NOTE]
> `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are commonly added as GitHub Secrets too if used during `npm run build` or `preflight`, though Vercel handles them at runtime.

---

## Optional Variables

### Notification Secrets (Phase 9 - Optional)

These secrets enable deployment notifications. **The system works without them** - they only add visibility.

| Variable | Description | Where to Set | Effect if Missing |
|----------|-------------|--------------|-------------------|
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL | GitHub Secrets | No Slack notifications |

**How to configure Slack Webhook**:
1. Go to [Slack API](https://api.slack.com/apps) → Create New App
2. Select "Incoming Webhooks" → Activate
3. Click "Add New Webhook to Workspace"
4. Select channel (e.g., `#deployments`)
5. Copy the Webhook URL
6. Add to GitHub Secrets as `SLACK_WEBHOOK_URL`

> [!NOTE]
> Notifications provide **awareness only**. They do not trigger automatic actions.

### Google OAuth (Optional)

If you want to enable Google login, set these variables:

| Variable | Scope | Description | Where to Set |
|----------|-------|-------------|--------------|
| `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | Public | Google OAuth Client ID | `.env.local`, Vercel |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Private | Google OAuth Client Secret | `.env.local`, Vercel Secrets |
| `GOOGLE_OAUTH_REDIRECT_URI` | Public | Redirect URI after login | `.env.local`, Vercel |
