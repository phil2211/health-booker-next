# Running Locally with Cloud Database

## Quick Answer

**Yes, you can run the application locally while keeping the database in the cloud.** The application is already configured to connect to MongoDB Atlas (cloud database) by default. You just need to:

1. Set up your `.env.local` file with your cloud MongoDB Atlas connection string
2. Ensure your IP address is whitelisted in MongoDB Atlas
3. Run `npm run dev` as usual

**You don't need to install or run MongoDB locally** - the application will connect to your cloud database automatically.

## Detailed Steps

### 1. Set Up Environment Variables

Create a `.env.local` file in the root of your project (if it doesn't exist) with the following variables:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
MONGODB_DB=health-booker-dev
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

**Important Notes:**
- Replace `<username>`, `<password>`, and `<cluster>` with your actual MongoDB Atlas credentials
- Use a separate database name (like `health-booker-dev`) to avoid affecting production data
- Generate a strong random secret for `NEXTAUTH_SECRET` (you can use `openssl rand -base64 32`)

### 2. Configure MongoDB Atlas Network Access

Your local machine needs permission to connect to MongoDB Atlas:

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Navigate to **Network Access** → **Add IP Address**
3. Add your current IP address (recommended for security) or `0.0.0.0/0` for development (less secure but convenient)

**Note:** If your IP changes frequently, you may need to update this setting.

### 3. Run the Application Locally

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

The app will automatically connect to your cloud MongoDB Atlas database using the connection string from `.env.local`.

## How It Works

The application uses the MongoDB connection configured in `lib/mongodb.ts`, which reads the `MONGODB_URI` environment variable. This connection string can point to:
- A local MongoDB instance (`mongodb://localhost:27017`)
- A cloud MongoDB Atlas instance (`mongodb+srv://...`)

Since you're using a cloud connection string, the app will connect to the cloud database automatically - no local MongoDB installation needed.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGODB_DB` | Database name (optional, defaults to `health-booker`) | `health-booker-dev` |
| `NEXT_PUBLIC_BASE_URL` | Public URL for the application | `http://localhost:3000` |
| `NEXTAUTH_URL` | NextAuth base URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret key for NextAuth session encryption | Random string (use `openssl rand -base64 32`) |

## Best Practices

1. **Use a separate database for local development** - Set `MONGODB_DB=health-booker-dev` to avoid accidentally modifying production data
2. **Keep `.env.local` in `.gitignore`** - Never commit database credentials to version control
3. **Use IP whitelisting** - Restrict MongoDB Atlas access to your specific IP address rather than `0.0.0.0/0` when possible
4. **Rotate secrets regularly** - Update `NEXTAUTH_SECRET` periodically for security

## Troubleshooting

### Connection Errors

If you see connection errors:
- Verify your `MONGODB_URI` is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure your MongoDB Atlas cluster is running
- Verify your database user credentials are correct

### Authentication Issues

If authentication isn't working:
- Ensure `NEXTAUTH_SECRET` is set and matches between sessions
- Check that `NEXTAUTH_URL` matches your actual local URL
- Verify `NEXT_PUBLIC_BASE_URL` is set correctly

### Environment Variables Not Loading

- Make sure the file is named `.env.local` (not `.env.local.example`)
- Restart the development server after changing environment variables
- Check that the file is in the project root directory

## Testing Locally

When running tests locally, they will also use the cloud database if configured:

```bash
# Run unit tests
npm test

# Run E2E tests (requires dev server running)
npm run cypress:open
# or
npm run cypress:run
```

**Note:** Consider using a separate test database or mocking database calls for tests to avoid affecting your development data.

