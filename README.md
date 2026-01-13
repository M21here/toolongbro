# Too Long Bro

> Books are long. We're not.

AI-powered document summarization that turns lengthy documents into concise, actionable summaries.

## Features

- **8 Summary Styles**: One-page, Full Context, ELI5, Study Notes, Actionable Takeaways, Flashcards, Executive Brief, Lecture Mode
- **Multi-Language**: English & Persian support
- **Multiple Formats**: PDF, DOCX, TXT (up to 50MB)
- **Parallel Processing**: Fast summarization with batched AI calls
- **Crypto Payments**: CoinPayments integration for subscriptions

## Quick Start

### Prerequisites

- Node.js 18+
- Anthropic API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-api03-xxx
DATABASE_URL="file:./dev.db"

# Privy Auth
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret

# CoinPayments (optional)
COINPAYMENTS_PUBLIC_KEY=your-public-key
COINPAYMENTS_PRIVATE_KEY=your-private-key
COINPAYMENTS_MERCHANT_ID=your-merchant-id
COINPAYMENTS_IPN_SECRET=your-ipn-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
docker build -t toolongbro .
docker run -p 3000:3000 --env-file .env.local toolongbro
```

### Self-Hosted

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 16
- **Auth**: Privy
- **Database**: Prisma + SQLite/PostgreSQL
- **AI**: Anthropic Claude Haiku 4.5
- **Payments**: CoinPayments
- **Styling**: Tailwind CSS

## Project Structure

```
├── app/                  # Next.js app router
│   ├── api/             # API routes
│   ├── subscription/    # Subscription pages
│   └── page.tsx         # Main page
├── components/          # React components
├── lib/                 # Core logic
│   ├── ai/             # AI client
│   ├── parsers/        # Document parsers
│   └── summarization/  # Pipeline
├── prisma/             # Database schema
└── public/             # Static assets
```

## License

MIT

---

Built by [@Embrron](https://x.com/embrron)
