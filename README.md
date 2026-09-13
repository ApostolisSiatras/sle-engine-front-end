# React learning companion: levels 2–6

This runnable prototype provides an adaptive React exercise experience and an English-capable local-LLM connection for **only Levels 2, 3, 4, 5, and 6**. It does not alter supplied lesson HTML. The learner never sees a chatbot, prompts, model settings, or model messages.

## Run locally

1. From this folder, install dependencies: `npm install`.
2. Copy the example settings: `cp .env.example .env`.
3. Start an OpenAI-compatible local model server, such as LM Studio at `http://127.0.0.1:1234` or Ollama at `http://127.0.0.1:11434`.
4. Set `LOCAL_LLM_BASE_URL`, `LOCAL_LLM_API_PATH`, and `LOCAL_LLM_MODEL` in `.env`.
5. Run `npm run dev`. The browser opens the React app at `http://localhost:5173/react.html`.

For Ollama's OpenAI-compatible endpoint use:

```env
LOCAL_LLM_BASE_URL=http://127.0.0.1:11434
LOCAL_LLM_API_PATH=/v1/chat/completions
LOCAL_LLM_MODEL=qwen2.5:7b
```

For LM Studio, the supplied `.env.example` is the usual shape; replace `local-model` with the model identifier reported by your local server.

The browser calls `/api/llm/chat`. Vite's development proxy forwards that request to the configured local endpoint, so the local API key (if one is needed) stays in `.env` on the machine running Vite and is not sent to browser code. The connector expects the OpenAI chat-completions response shape (`choices[0].message.content`); adapting another local server is isolated to `src/services/llmClient.js` and `vite.config.js`.

## Adaptive exercises

Each level catalogue entry defines exactly one tag (`Beginner`, `Intermediate`, or `Pro`) and an objective. Learners begin at Level 2; later levels remain locked until they pass the preceding level. A passing attempt requires at least three answered questions with 70% or higher correct. The current supplied exercise remains visible in its original sandboxed HTML. The React exercise surface records attempts, answers, correctness, hints, and missed concepts. After an incorrect answer, **Try adapted variation** requests a different short-answer exercise variation that targets that concept while remaining within the selected level. State is intentionally in-memory only and resets on refresh.

The UI validates the required JSON fields before showing LLM output. It reports connection errors, malformed responses, and a 45-second timeout, each with a retry control. No invented fallback question is shown if the local model is unavailable.

## Structure

```text
src/data/levels.js          Level catalogue (exactly 2–6)
src/components/             Level picker, safe lesson viewer, learner-facing exercise interface
src/services/llmClient.js   Hidden structured exercise adaptation, validation and timeout handling
vite.config.js              Local endpoint proxy and server-side environment settings
scripts/sync-levels.mjs     Copies only supplied levels 2–6 for Vite to serve
```

The lesson viewer uses a sandboxed iframe, loading the supplied HTML as-is. The sync script intentionally copies only `level2.html` through `level6.html` and their existing shared image assets; it never modifies source lessons.

## Add a level later

When the scope expands, add the supplied `levelN.html` to the `levels` array in `src/data/levels.js` and add `N` to `scripts/sync-levels.mjs`. No component redesign is required. Do not do this for the current prototype: its catalogue is deliberately restricted to levels 2–6.
