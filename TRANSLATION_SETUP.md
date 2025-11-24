# Setting Up Auto-Translation

To enable the auto-translation feature in the profile editor, you need to add a Google Gemini API key to your environment variables.

## Step 1: Get a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## Step 2: Add to Environment Variables

1. Open your `.env.local` file in the project root
2. Add the following line:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```
3. Replace `your-api-key-here` with the API key you copied
4. Save the file

## Step 3: Restart the Development Server

If the dev server is running, restart it to load the new environment variable:

```bash
# Stop the current server (Ctrl+C)
# Then restart it:
npm run dev
```

## Step 4: Test the Translation

1. Navigate to `http://localhost:3000/dashboard/profile` (or `/de/dashboard/profile` for German)
2. Enter some text in the English Bio field
3. Click "Translate from English" under the German Bio field
4. The text should be automatically translated to German

## Troubleshooting

### "Translation service is not configured" error
- Make sure you added `GEMINI_API_KEY` to `.env.local`
- Restart the development server after adding the key

### "Failed to translate text" error
- Check that your API key is valid
- Ensure you have API quota remaining (free tier has limits)
- Check the browser console and server logs for more details

### Translation is slow
- The Gemini API can take a few seconds to respond
- This is normal for the free tier

## API Limits

The free tier of Google Gemini API has the following limits:
- 60 requests per minute
- 1,500 requests per day

For production use, consider upgrading to a paid plan.

## Security Note

Never commit your `.env.local` file to version control. It's already in `.gitignore` to prevent accidental commits.
