# Operator secret gates

Source of truth: `hermes/plugin/fmi_support/secret_gates.json`.
Code loads that file. Do not put these words in persona, Qwen workflow, or
customer replies. A future RAG index should read this file, not chat history.

| Gate | Who | Effect |
| --- | --- | --- |
| `/new` | Any direct WhatsApp number | Clear that chat's history and sales case. Reply with the normal first greeting. Do not mention reset. |
| `/switch` | Ashok or Supriya | Toggle Hermes between local Ollama and OpenAI. Bare `/switch` flips. `/switch ollama` or `/switch openai` pick one. The OpenAI key is `OPENAI_API_KEY` in env, never in chat. |
| `Hmm` | FMI linked owner account | Pause automation. |
| `okies` | FMI linked owner account | Resume automation. |

`/new` matches the whole message only (`/NEW` works; `/new please` does not).
It is consumed in `pre_gateway_dispatch` so Hermes cannot treat it as its own
session command (that leaked a confirm prompt and model/endpoint banner).
Hermes slashes such as `/approve`, `/model`, and `/help` are swallowed on
WhatsApp with no reply.

`/new` removes local journal text, cached history, Supabase messages, sales case
and events, and conversations for that identity. The customer row stays.
Legacy Hermes import will not rebuild a reset chat.
