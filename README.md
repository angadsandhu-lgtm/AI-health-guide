# Aria, AI health guide

A Next.js site that answers general health questions with Claude. Web search is restricted to the 10 sites in `lib/sources.js`, and every answer lists the pages it used. Educational only, not medical advice.

## 1. What you need
- GitHub account (free)
- Vercel account (free Hobby plan to start)
- Anthropic API account at console.anthropic.com (this is the paid "AI brain" of the site)
- Node.js 18.17 or newer on your computer (nodejs.org)

## 2. Anthropic setup
1. Console, API keys, create a key. Never commit it to GitHub.
2. Add credit, then set a monthly spend limit in the Console so costs can't run away.
3. In Console settings, make sure web search is enabled for your organization.

## 3. Run it on your computer first
```
npm install
cp .env.example .env.local     # then open .env.local and paste your key + your name
npm run dev
```
Open http://localhost:3000 and ask a question.

### Test for free first
Put `MOCK_MODE=true` in `.env.local` (no API key needed). The site returns a sample answer so you can check the layout, buttons, watermark and emergency banner (try typing "chest pain"). You can also set it on Vercel to test the deployed link on your phone. **Delete MOCK_MODE before going live**, or visitors will see fake answers.

## 4. Put it on GitHub
Create an empty repo on github.com (no README), then:
```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## 5. Deploy on Vercel
1. vercel.com, Add New, Project, import your GitHub repo.
2. Open Environment Variables and add `ANTHROPIC_API_KEY` and `NEXT_PUBLIC_CREATOR` (your name for the watermark).
3. Click Deploy. You get a link like `your-project.vercel.app` that works on any device.
4. Changed a variable later? Redeploy so it takes effect. Every `git push` redeploys automatically.
5. Optional: Settings, Domains, to attach your own domain.

## 6. Running for ~1,000 people for a month
- Vercel scales the site automatically. The real limits are your Anthropic spend and rate limits.
- Cost = visitors x questions each x cost per question. Ask 20 test questions, check Console usage, and multiply. Web searches are billed separately from tokens.
- `ANTHROPIC_MODEL` defaults to `claude-haiku-5-5` (cheaper). Use `claude-sonnet-5-5` for higher quality.
- `RATE_LIMIT_PER_HOUR` (default 20 questions per visitor) protects your budget. It is stored in server memory, so it is approximate. For strict limits, add Upstash Redis from the Vercel Marketplace.
- The Hobby plan is for non-commercial use. If the site earns money or runs for a business, use Vercel Pro. Check vercel.com/pricing for current limits.
- The app stores no conversations. Still add a short privacy notice, and tell users not to share personal details.
