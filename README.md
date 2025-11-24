# Health Worker Booking System


A modern, full-stack reservation system for scheduling appointments with health workers, built with Next.js 15, TypeScript, MongoDB Atlas, and deployed on Vercel.

## Architecture

This project follows a cloud-native architecture designed for developer velocity and operational simplicity:

- **Frontend & Backend**: Next.js 15 with App Router
- **Database**: MongoDB Atlas
- **Deployment**: Vercel (framework-native platform)
- **CI/CD**: GitHub Actions for quality gates, Vercel for deployment
- **Testing**: Jest + React Testing Library (unit/component)

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- MongoDB Atlas account (free tier available)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd health-booker-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB Atlas**
   
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a free cluster
   - Create a database user
   - Whitelist your IP address (or use `0.0.0.0/0` for development)
   - Get your connection string

4. **Configure environment variables**
   
   Copy the example environment file and fill in your values:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your configuration:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   MONGODB_DB=health-booker
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   GEMINI_API_KEY=your-gemini-api-key-here  # Required for auto-translation feature
   ```
   
   **Note**: To use the auto-translation feature in the profile editor, you need a Google Gemini API key. Get one from [Google AI Studio](https://makersuite.google.com/app/apikey).

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Multi-Language Profile Management

The system supports **English** and **German** languages with intelligent auto-translation:

- **Therapist Profile Editing**: Therapists can edit their profile information in both languages
- **Auto-Translation**: Powered by Google Gemini API, therapists can:
  - Write their bio in one language and automatically translate to the other
  - Translate their specialization between English and German
  - Edit translations manually for fine-tuning
- **Locale-Aware Display**: The dashboard automatically displays content in the user's preferred language
- **Backward Compatibility**: Existing profiles without translations will fall back to the original `bio` and `specialization` fields

To access the profile editor:
1. Log in to the therapist dashboard
2. Click the "Edit" link in the profile section
3. Edit your information in both languages
4. Use the translation buttons to auto-translate content
5. Save your changes

## Project Structure

```
/app                 # Next.js app directory (pages and API routes)
  /api              # Backend API routes
  /components       # Reusable React components
/lib                # Utility functions and database connection
/models             # MongoDB document models
/types              # TypeScript type definitions
/public             # Static assets
/__tests__          # Jest unit and component tests
.github/workflows   # GitHub Actions CI/CD pipelines
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## Testing

### Unit/Component Tests (Jest + React Testing Library)

Run tests with:
```bash
npm test
```

Tests are located in the `__tests__` directory and co-located with components.

## Database Schema

### HealthProvider Collection
```typescript
{
  _id: string
  name: string
  specialization: string
  email: string
  phone: string
  availability: Array<{
    dayOfWeek: number (0-6)
    startTime: string (HH:mm)
    endTime: string (HH:mm)
    isAvailable: boolean
  }>
  bio?: string
  credentials?: string[]
  createdAt: Date
  updatedAt: Date
}
```

### Booking Collection
```typescript
{
  _id: string
  providerId: string
  patientId: string
  appointmentDate: Date
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  reason?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

### Patient Collection
```typescript
{
  _id: string
  name: string
  email: string
  phone: string
  dateOfBirth?: Date
  address?: string
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }
  createdAt: Date
  updatedAt: Date
}
```

## Deployment

### Deploying to Vercel

1. **Push your code to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure environment variables**
   - In Vercel dashboard, go to Project Settings > Environment Variables
   - Add the following variables:
     - Key: `MONGODB_URI`
       Value: Your MongoDB Atlas connection string
     - Key: `MONGODB_DB`
       Value: `health-booker`
     - Key: `NEXT_PUBLIC_BASE_URL`
       Value: Your production domain (e.g., `https://your-app.vercel.app`)
     - Key: `NEXTAUTH_URL`
       Value: Your production domain (e.g., `https://your-app.vercel.app`)
     - Key: `NEXTAUTH_SECRET`
       Value: A randomly generated secret key

4. **Deploy**
   - Vercel will automatically deploy on push to main
   - Preview deployments are created for every pull request

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs the following on every pull request:

1. **Quality Gates**:
   - ESLint code linting
   - TypeScript type checking
   - Jest unit tests with coverage

2. **Build Check**:
   - Production build verification

Only PRs passing all checks can be merged to main.

## MongoDB Atlas Setup

1. **Create an account** at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Create a cluster** (free M0 tier is sufficient for development)
3. **Create a database user**:
   - Go to "Database Access" → "Add New Database User"
   - Save the username and password
4. **Whitelist IP addresses**:
   - Go to "Network Access" → "Add IP Address"
   - Add `0.0.0.0/0` for development (or your specific IP)
5. **Get connection string**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Testing**: [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/react)
- **Deployment**: [Vercel](https://vercel.com/)
- **CI/CD**: [GitHub Actions](https://github.com/features/actions)

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests as needed
4. Run quality checks: `npm run lint && npm run type-check && npm test`
5. Submit a pull request

All PRs must pass CI checks before merging.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

