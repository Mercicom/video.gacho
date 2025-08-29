# Video Analyzer (Gemini)

Analyze videos locally to extract:
- Visual Hook, Text Hook, Voice Hook
- Full spoken script transcript
- Key pain point

Built with Next.js 14 (App Router) and Google Gemini. No AI or dev knowledge required.

## Quick Start

1) Fork this repo to your GitHub account
2) Clone your fork to your computer
3) Install Node.js LTS (18+): https://nodejs.org
4) Get a free Google Gemini API key: https://aistudio.google.com/app/apikey
5) In the project folder, run:

```
npm install
npm run setup   # this asks for your Gemini API key and creates .env.local
npm run dev
```

6) Open http://localhost:3000/video-analyzer

That’s it. Upload video files and click Analyze.

## Environment Variables

Only one is required to run the Video Analyzer:
- `GOOGLE_API_KEY` – your Gemini API key

You can also set optional limits (defaults shown):
- `RATE_LIMIT_PER_MINUTE=10`
- `MAX_VIDEO_SIZE_MB=100`
- `MAX_VIDEOS_PER_BATCH=50`

See `.env.example` for a full list (other providers are optional and not needed for video analysis).

## Troubleshooting

- Missing API key: Run `npm run setup` again or create `.env.local` manually using `.env.example` as a template.
- Rate limit errors: The tool automatically waits and resumes. Reduce batch size or increase `RATE_LIMIT_PER_MINUTE` if your API plan allows.
- Large files: Default max is 100MB. Increase `MAX_VIDEO_SIZE_MB` if you need to.

## Tech Stack

- Next.js 14 (App Router), React 18
- TailwindCSS
- Google Gemini (`@google/generative-ai`)
