// API Route configuration for transcribe-medical
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}

// Runtime configuration for Next.js 13+ App Router
export const runtime = 'nodejs'
export const maxDuration = 60 // Maximum allowed on Vercel Pro plan
