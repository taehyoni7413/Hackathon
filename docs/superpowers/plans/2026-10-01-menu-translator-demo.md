# Menu Translator Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended; inline execution is fine here). Steps use checkbox syntax for tracking.

**Goal:** Add a small Flask web demo that lets a user select a sample school-area menu and inspect the existing Korean-to-English/Chinese translation result.

**Architecture:** `app.py` serves one page and JSON routes. The page loads fixtures from `/api/restaurants`, calls `/api/translate`, and renders the Pydantic result. `menu_translator.py` remains the single source of truth and automatically uses mock mode when no key is present.

**Tech Stack:** Python 3, Flask, OpenAI SDK/Pydantic, vanilla HTML/CSS/JavaScript.

---

### Tasks

- [ ] Add Flask routes and page template.
- [ ] Add responsive styles and client-side rendering.
- [ ] Add route tests and run the full suite plus a local smoke check.
