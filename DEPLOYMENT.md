# 🚀 Deployment Guide

## Overview

The web version can be deployed to any static hosting service. Here are the most popular options.

## Prerequisites

```bash
# Build the production version
npm run build
```

This creates an optimized build in the `dist/` folder.

## Option 1: Netlify (Recommended)

### Method A: Drag & Drop (Easiest)

1. Build the project:
   ```bash
   npm run build
   ```

2. Go to [Netlify Drop](https://app.netlify.com/drop)

3. Drag the `dist/` folder onto the page

4. Done! Your site is live.

### Method B: CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Method C: Git Integration

1. Push code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Deploy!

**Pros:**
- Free tier available
- Automatic HTTPS
- Custom domains
- Continuous deployment
- Fast CDN

## Option 2: Vercel

### CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Build
npm run build

# Deploy
vercel --prod
```

### Git Integration

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Vercel auto-detects Vite
5. Deploy!

**Pros:**
- Free tier available
- Automatic HTTPS
- Edge network
- Zero configuration
- Great performance

## Option 3: GitHub Pages

### Setup

1. Install gh-pages:
   ```bash
   npm install -g gh-pages
   ```

2. Add to `package.json`:
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

4. Enable GitHub Pages in repository settings:
   - Settings → Pages
   - Source: gh-pages branch
   - Save

**Pros:**
- Free for public repos
- Integrated with GitHub
- Simple workflow

**Cons:**
- Requires public repository
- Manual updates needed

## Option 4: Cloudflare Pages

### Git Integration

1. Push code to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com)
3. Create new project
4. Connect repository
5. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
6. Deploy!

**Pros:**
- Free tier available
- Global CDN
- Fast performance
- DDoS protection
- Analytics included

## Option 5: Firebase Hosting

### Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy
```

**Pros:**
- Free tier available
- Google infrastructure
- Custom domains
- SSL included

## Option 6: Surge

### Quick Deploy

```bash
# Install Surge
npm install -g surge

# Build
npm run build

# Deploy
cd dist
surge
```

**Pros:**
- Extremely simple
- Free tier
- Custom domains
- Fast deployment

## Option 7: AWS S3 + CloudFront

### Setup

1. Create S3 bucket
2. Enable static website hosting
3. Upload `dist/` contents
4. Create CloudFront distribution
5. Point to S3 bucket

**Pros:**
- Highly scalable
- Professional grade
- Full AWS integration

**Cons:**
- More complex setup
- Costs money (but cheap)

## Comparison Table

| Service | Free Tier | HTTPS | Custom Domain | Difficulty |
|---------|-----------|-------|---------------|------------|
| Netlify | ✅ | ✅ | ✅ | ⭐ Easy |
| Vercel | ✅ | ✅ | ✅ | ⭐ Easy |
| GitHub Pages | ✅ | ✅ | ✅ | ⭐⭐ Medium |
| Cloudflare | ✅ | ✅ | ✅ | ⭐⭐ Medium |
| Firebase | ✅ | ✅ | ✅ | ⭐⭐ Medium |
| Surge | ✅ | ✅ | ✅ | ⭐ Easy |
| AWS S3 | ❌ | ✅ | ✅ | ⭐⭐⭐ Hard |

## Custom Domain Setup

### Netlify
1. Go to Domain settings
2. Add custom domain
3. Update DNS records
4. Wait for propagation

### Vercel
1. Go to Project settings
2. Add domain
3. Configure DNS
4. Automatic SSL

### GitHub Pages
1. Add CNAME file to `dist/`:
   ```
   yourdomain.com
   ```
2. Update DNS records
3. Enable HTTPS in settings

## Environment Variables

If you need environment variables:

### Vite
Create `.env` file:
```
VITE_API_URL=https://api.example.com
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

### Netlify
Add in dashboard: Site settings → Environment variables

### Vercel
Add in dashboard: Project settings → Environment Variables

## Performance Optimization

### Before Deployment

1. **Optimize build:**
   ```bash
   npm run build
   ```

2. **Check bundle size:**
   ```bash
   npm run build -- --mode production
   ```

3. **Test production build:**
   ```bash
   npm run preview
   ```

### After Deployment

1. **Enable compression** (usually automatic)
2. **Set cache headers** (usually automatic)
3. **Use CDN** (included with most services)
4. **Monitor performance** with Lighthouse

## Continuous Deployment

### Automatic Deploys

Most services support automatic deployment:

1. Push to GitHub
2. Service detects changes
3. Builds automatically
4. Deploys to production

### Branch Previews

Services like Netlify and Vercel create preview URLs for pull requests.

## Monitoring

### Analytics

Add analytics to `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

### Error Tracking

Add Sentry or similar:

```bash
npm install @sentry/browser
```

## Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 404 Errors

Add `_redirects` file to `public/`:
```
/*    /index.html   200
```

### Slow Loading

1. Check bundle size
2. Enable compression
3. Use CDN
4. Optimize images

## Security

### Headers

Add security headers (varies by service):

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

### HTTPS

All recommended services provide free HTTPS.

## Cost Estimates

### Free Tier Limits

- **Netlify**: 100GB bandwidth/month
- **Vercel**: 100GB bandwidth/month
- **GitHub Pages**: 100GB bandwidth/month
- **Cloudflare**: Unlimited bandwidth
- **Firebase**: 10GB storage, 360MB/day

### Paid Plans

If you exceed free tier:
- **Netlify**: $19/month
- **Vercel**: $20/month
- **Cloudflare**: $20/month
- **AWS**: Pay per use (~$1-5/month for small sites)

## Recommended Setup

For this project, we recommend:

1. **Development**: Local with `npm run dev`
2. **Staging**: Netlify/Vercel preview
3. **Production**: Netlify/Vercel with custom domain

## Quick Deploy Commands

```bash
# Netlify
npm run build && netlify deploy --prod --dir=dist

# Vercel
npm run build && vercel --prod

# GitHub Pages
npm run build && gh-pages -d dist

# Surge
npm run build && cd dist && surge

# Firebase
npm run build && firebase deploy
```

## Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] All features work
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Fast load time (<3s)
- [ ] HTTPS enabled
- [ ] Custom domain configured (if applicable)
- [ ] Analytics working (if added)
- [ ] SEO meta tags present

## Support

If you encounter issues:

1. Check service status page
2. Review build logs
3. Test locally with `npm run preview`
4. Check service documentation
5. Contact service support

---

**Your ecosystem is ready to go live! 🌍🚀**
