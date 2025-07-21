# Multiple Filings Test Guide

## Testing the Fix for Multiple Filings

### What was fixed:
The API route (`/api/chat/route.ts`) was only sending the first filing to the LLM. Now it sends all selected filings.

### How to test:

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Navigate to a company page** (e.g., `/company/AAPL`)

3. **Add multiple filings:**
   - Click "Add Filing" button in the right sidebar
   - Select a 10-K filing
   - Click "Add Filing" again
   - Select a 10-Q filing
   - You should now see both filings listed in the sidebar

4. **Send a test message:**
   - Type: "Compare the revenue figures between the 10-K and 10-Q filings"
   - The AI should now be able to reference both filings in its response

### What to look for in the browser console:

When you send a message, you should see logs like:
```
Chat API received: { filingsCount: 2, ... }
All filing forms received: ["10-K", "10-Q"]
System prompt includes 2 filings: [{ form: "10-K", date: "..." }, { form: "10-Q", date: "..." }]
```

### Expected behavior:
- The AI should be able to answer questions that require information from multiple filings
- When you add/remove filings in the UI, those changes should be reflected in the AI's responses
- The system should handle 2, 3, 4, or even 5 filings as mentioned in the original request

### Troubleshooting:
If the AI still only references one filing:
1. Check the browser console for the logs mentioned above
2. Verify that multiple filings are shown in the sidebar
3. Make sure you're asking questions that would require data from multiple filings
