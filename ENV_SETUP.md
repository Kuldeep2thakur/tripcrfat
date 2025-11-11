# Environment Variables Setup

## Required for AI Trip Planner

To use the Gemini-powered trip planner, you need to set up a Google AI API key.

### Steps:

1. **Get a Gemini API Key**
   - Visit: https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated key

2. **Create `.env.local` file**
   - In the project root (same directory as `package.json`), create a file named `.env.local`
   - Add the following line:
   ```
   GOOGLE_GENAI_API_KEY=your_api_key_here
   ```
   - Replace `your_api_key_here` with your actual API key

3. **Restart the development server**
   ```bash
   npm run dev
   ```

### Alternative Environment Variable Names

The app will also check for `GOOGLE_API_KEY` if `GOOGLE_GENAI_API_KEY` is not set.

### Troubleshooting

If you see "API key not configured" error:
- Verify the `.env.local` file exists in the project root
- Check that the variable name is exactly `GOOGLE_GENAI_API_KEY`
- Restart the dev server after creating/updating `.env.local`
- Check the terminal for any error messages

### Security Note

- Never commit `.env.local` to version control (it's already in `.gitignore`)
- Keep your API key secret
- Don't share your API key in screenshots or logs
