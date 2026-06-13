# Codely AI Chat — System Design

## Overview

We are adding an **AI coding assistant panel** to Codely's right sidebar. Every user gets free AI help powered by Google Gemini's free API tier, with an optional upgrade path for users who have their own API keys for Claude, OpenAI, etc.

---

## How It Works (User's Perspective)

### Scenario 1: A casual user (no API key)

```
1. User opens Codely → joins a room → writes some code
2. User clicks the "AI" icon in the toolbar (right side)
3. A chat panel slides open on the right
4. User types: "Explain this code" or "Fix the bug on line 5"
5. Codely automatically attaches the current tab's code as context
6. The message is sent to OUR server → OUR server calls Google Gemini (free)
7. Gemini's response streams back into the chat panel
8. User sees the AI's answer in real-time ✅
```

> No login. No API key. No payment. It just works.

### Scenario 2: A power user (has their own Claude/OpenAI key)

```
1. User clicks the ⚙️ icon in the AI chat panel
2. A settings dropdown appears with:
   - Provider selector: [Gemini (Free)] [Claude] [OpenAI] [Groq]
   - API Key input field: [paste your key here]
3. User selects "Claude" and pastes their API key
4. Key is saved in localStorage (never sent to our server)
5. Now all AI requests go directly from their browser → Claude's API
6. User gets Claude-quality responses using their own quota ✅
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │              │  │              │  │     AI Chat Panel       │ │
│  │   Tabs Bar   │  │    Code      │  │                        │ │
│  │              │  │   Editor     │  │  ┌──────────────────┐  │ │
│  │  main.js     │  │   (Monaco)   │  │  │ Chat Messages    │  │ │
│  │  utils.py    │  │              │  │  │                  │  │ │
│  │  style.css   │  │  [the code   │  │  │ User: "explain   │  │ │
│  │              │  │   user is    │──┼──│  this code"      │  │ │
│  │              │  │   editing]   │  │  │                  │  │ │
│  │              │  │              │  │  │ AI: "This is a   │  │ │
│  │              │  │              │  │  │  function that.."│  │ │
│  │              │  │              │  │  └──────────────────┘  │ │
│  │              │  │              │  │                        │ │
│  │              │  │              │  │  ┌──────────────────┐  │ │
│  │              │  │              │  │  │ [Attach Files ▼] │  │ │
│  │              │  │              │  │  │ [Type message..] │  │ │
│  │              │  │              │  │  │           [Send] │  │ │
│  │              │  │              │  │  └──────────────────┘  │ │
│  └──────────────┘  └──────────────┘  └───────────┬────────────┘ │
│                                                  │              │
│                         ┌────────────────────────┤              │
│                         │    ROUTING LOGIC       │              │
│                         │                        │              │
│                  ┌──────▼──────┐          ┌──────▼──────┐       │
│                  │ Free Mode   │          │ BYOK Mode   │       │
│                  │ (Default)   │          │ (Optional)  │       │
│                  └──────┬──────┘          └──────┬──────┘       │
│                         │                        │              │
│                  ┌──────▼────────────────────────▼──────┐       │
│                  │           CHAT SCOPE                 │       │
│                  │ 🔗 Shared Mode (Room Broadcast)      │       │
│                  │ 🔒 Private Mode (Local Only)         │       │
│                  └──────┬────────────────────────┬──────┘       │
└─────────────────────────┼────────────────────────┼──────────────┘
                          │                       │
                          ▼                       ▼
                  ┌───────────────┐      ┌─────────────────┐
                  │  OUR SERVER   │      │  AI Provider    │
                  │  (Express)    │      │  (Direct call)  │
                  │               │      │                 │
                  │  /api/chat    │      │  Claude API     │
                  │               │      │  OpenAI API     │
                  │  Rate Limiter │      │  Groq API       │
                  │  ↓            │      │                 │
                  │  Google       │      └─────────────────┘
                  │  Gemini API   │
                  │  (FREE tier)  │
                  └───────────────┘
```

---

## Two Modes Explained

### Mode 1: Free Mode (Default) — Server-Proxied

```
Browser  ──POST /api/chat──▶  Our Server  ──API call──▶  Google Gemini (Free)
                                  │
                            Rate Limiter
                         (max 10 msgs/min
                          per user session)
```

**Why do we need the server as a proxy?**

This is the critical design decision. Here's why:

1. **API Key Security:** If we put the Gemini API key directly in the frontend JavaScript code, anyone could open DevTools, find the key, and steal it. By keeping the key on our server, it's hidden from users.

2. **Rate Limiting:** Without a server, one malicious user could spam 1000 requests and exhaust our free quota. Our server tracks requests per user (by socket ID) and limits them.

3. **CORS:** Google's Gemini API blocks direct browser requests anyway. The server acts as a middleman.

**Data Flow:**
```
Step 1: User types "explain this code" + code from active tab
Step 2: Browser sends POST to our server:
        {
          message: "explain this code",
          code: "function add(a, b) { return a + b; }",
          language: "javascript",
          history: [previous messages...]
        }
Step 3: Server checks rate limit (10 msgs/min per session)
Step 4: Server builds a prompt for Gemini:
        "You are a coding assistant. The user is working in JavaScript.
         Here is their code: [code]. User asks: [message]"
Step 5: Server calls Gemini API with our free API key
Step 6: Gemini responds with streamed text
Step 7: Server streams the response back to the browser via SSE
Step 8: Chat panel shows the AI response word-by-word
```

### Mode 2: BYOK Mode — Direct from Browser

```
Browser  ──API call──▶  Claude/OpenAI/Groq API (User's own key)
   │
   └── API key from localStorage (never touches our server)
```

**Why can this go direct?**

When using their own key, the user accepts the responsibility. Some providers like OpenAI and Groq allow direct browser calls (CORS enabled). For Claude (which blocks CORS), we'd route through our server but **pass the user's key in the request** — our server just forwards it without storing it.

**Data Flow:**
```
Step 1: User types message + code context
Step 2: Browser reads API key from localStorage
Step 3: Browser calls the AI provider directly (or via our proxy if CORS blocked)
Step 4: Response streams back to the chat panel
```

---

## Server Changes

### New File: `server/aiProxy.js`

This is a new Express route that handles the free-tier AI requests:

```
server/
├── index.js           (existing — add the new route)
├── socketHandlers.js  (existing — no changes)
├── roomStore.js       (existing — no changes)
├── cleanup.js         (existing — no changes)
└── aiProxy.js         (NEW — handles AI chat requests)
```

**What `aiProxy.js` does:**
1. Receives the user's message + code context
2. Checks rate limit (stored in-memory, keyed by IP or session)
3. Builds a system prompt optimized for coding assistance
4. Calls Google Gemini API (free tier)
5. Streams the response back using Server-Sent Events (SSE)

### Rate Limiting Strategy

```
┌─────────────────────────────────────┐
│         Rate Limit Rules            │
├─────────────────────────────────────┤
│ Free Mode:                          │
│   • 10 messages per minute per user │
│   • 50 messages per hour per user   │
│   • Max 2000 chars per message      │
│   • Max 5000 chars of code context  │
│                                     │
│ BYOK Mode:                          │
│   • No limits (user's own quota)    │
└─────────────────────────────────────┘
```

---

## Frontend Changes

### New Components

```
client/src/
├── components/
│   ├── AIChatPanel.jsx    (NEW — the main chat sidebar)
│   ├── AIChatPanel.css    (NEW — styles)
│   ├── AIChatMessage.jsx  (NEW — individual message bubble)
│   ├── AIChatSettings.jsx (NEW — provider/key settings modal)
│   └── ...existing...
```

### AIChatPanel Layout

```
┌──────────────────────────────┐
│  🤖 AI Assistant    ⚙️  ✕   │  ← Header with settings & close
├──────────────────────────────┤
│                              │
│  ┌────────────────────────┐  │
│  │ 👤 You                 │  │
│  │ "Can you explain what  │  │
│  │  this function does?"  │  │
│  │                        │  │
│  │ 📎 main.js (attached)  │  │  ← Shows which file was sent
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🤖 Gemini              │  │
│  │ "This function takes   │  │
│  │  two parameters and    │  │
│  │  returns their sum..." │  │
│  │                        │  │
│  │  ```js                 │  │  ← AI can return formatted code
│  │  function add(a, b) {  │  │
│  │    return a + b;       │  │
│  │  }                     │  │
│  │  ```                   │  │
│  └────────────────────────┘  │
│                              │
├──────────────────────────────┤
│ [📎 Attach Code]             │  ← One-click: sends active tab code
│ ┌──────────────────────┐ [➤] │
│ │ Type your message... │     │  ← Input field + send button
│ └──────────────────────┘     │
└──────────────────────────────┘
```

### How "Attach Files" Works

When user clicks the 📎 button:
```
1. A dropdown appears showing all currently open tabs.
2. The user can check/uncheck multiple tabs (default: active tab is checked).
3. The selected tabs' code, language, and filenames are bundled together.
4. When sent, the bundled code is attached as context to the message.
5. The chat shows a small preview chip: "📎 2 files attached (142 lines)"
```

---

## What We Need to Set Up

### Google Gemini Free API Key

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key" (completely free, just needs a Google account)
3. Copy the key
4. Add it as an environment variable on Render:
   - Key: `GEMINI_API_KEY`
   - Value: `your-key-here`

### Environment Variables on Render

```
NODE_ENV=production          (already set)
GEMINI_API_KEY=AIzaSy...     (new — free key from Google)
```

---

## Security Considerations

| Concern | Solution |
|---|---|
| API key exposure | Key lives on server only, never sent to frontend |
| Abuse / spam | Rate limiting per IP (10 msg/min, 50 msg/hr) |
| Large payloads | Max 2000 char message + 5000 char code |
| Prompt injection | System prompt is server-side, user can't override it |
| BYOK key safety | Stored in `sessionStorage` (clears on tab close) and AES-encrypted using a session-derived key before storage. Never sent to our database. |
| Chat history privacy | Stored in browser memory only, cleared on page refresh |

---

## Summary

```
┌─────────────────────────────────────────────┐
│           WHAT WE BUILD                     │
├─────────────────────────────────────────────┤
│                                             │
│  Frontend:                                  │
│  • AI Chat Panel (right sidebar)            │
│  • Chat message bubbles with markdown       │
│  • "Attach Code" button                     │
│  • Settings modal (provider + API key)      │
│                                             │
│  Backend:                                   │
│  • POST /api/chat endpoint                  │
│  • Rate limiter (in-memory)                 │
│  • Gemini API integration                   │
│  • SSE streaming for real-time responses    │
│                                             │
│  Cost: $0 (Google Gemini free tier)         │
│  Auth: None needed                          │
│  Privacy: Chat is ephemeral (not saved)     │
│                                             │
└─────────────────────────────────────────────┘
```
