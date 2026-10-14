# Campus Customs Agent Desk (MGT 409, HW 5)

A five-agent team (Boss, Inventory, Accounting, Facilities, Customer Service), built with PydanticAI on `gpt-6-luna` through Portkey, handles the shop's tickets. All shop data goes through a FastMCP server. A FastAPI backend runs the team, and a React dashboard lets a human watch the agents and approve every payment, purchase, or price.

## Project structure

```
HW 5/
├── AI_prompts.md            # every prompt used, per problem
├── README.md                # this file
├── requirements.txt         # backend Python packages
├── .env.example             # copy to .env and add your Portkey key
├── .gitignore
├── .mcp.json                # Claude Code / backend config for the MCP server
├── data/
│   ├── campus_customs.db       # ORIGINAL database (never modified)
│   └── campus_customs_new.db   # WORKING copy the system reads and writes
├── mcp_server/              # FastMCP server (20 tools) + its own requirements.txt
├── backend/                 # agents, prompts, FastAPI app (main.py), CLI (cli.py)
├── frontend/                # React + Vite + TypeScript dashboard
└── output/                  # harness, plans, results, audit trail, screenshots
```

## 1. One-time setup

You need Python 3.11+ (tested with 3.14) and Node.js 20.19+ (tested with 24). Run everything from this `HW 5/` folder.

```bash
# Backend + agents
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# MCP server (it has its own venv; .mcp.json points to it)
python3 -m venv mcp_server/.venv
mcp_server/.venv/bin/pip install -r mcp_server/requirements.txt

# Dashboard
cd frontend && npm install && cd ..

# Your Portkey key
cp .env.example .env      # then edit .env and set PORTKEY_API_KEY
```

## 2. Clean start: copy the original database to the working copy

The repository ships with `data/campus_customs_new.db` in its final state from the Problem 9 run (all three tickets resolved, checking at $152.00). To start fresh, copy the original over it:

```bash
cp data/campus_customs.db data/campus_customs_new.db
```

The dashboard's **Reset day** button (or `POST /api/reset`) does the same thing while the app is running. It only ever *reads* `campus_customs.db`.

## 3. Start the MCP server

You don't have to start it by hand. The backend starts it automatically from `.mcp.json` when it boots, and Claude Code does the same when you open this folder (approve the `campus-customs` server when asked). To run it on its own, for example to inspect the tools:

```bash
mcp_server/.venv/bin/python mcp_server/server.py          # stdio
mcp_server/.venv/bin/python mcp_server/server.py --http   # http://127.0.0.1:8001/mcp
```

## 4. Start the FastAPI backend

```bash
cd backend
source ../.venv/bin/activate
uvicorn main:app --reload --port 8000
```

Check http://localhost:8000/api/health. The interactive API docs are at http://localhost:8000/docs.

## 5. Launch the React board

In a second terminal:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173. Use `?ticket=102` to open a specific ticket.

## 6. Run all three tickets

1. Type your name in the top-right box. Every approval is signed with it.
2. Click **Reset day** and confirm. Tickets 101–103 go back to open and checking goes back to $3,400.00.
3. Select a ticket and click **Start agent team**. Watch the roster and live activity feed.
4. When an agent proposes a payment, purchase, or price, approve or reject it on its slip in **Approvals**. Only this step moves cash, and the server re-checks that there's enough.
5. Click **Run agents again** so the team can see your decision. The Boss resolves the ticket once nothing is pending.

In the Problem 9 run this took 3 runs for 101, 2 for 102 and 2 for 103.

Terminal alternative (no dashboard): `.venv/bin/python -m backend.cli --tickets 102`.

## Safety rules (summary)

- Agents can only **propose** payments, purchases, and price overrides. Only the human approval route (`POST /api/approvals/{id}/approve`) moves cash. It needs a per-process key that agents never see.
- There's no payment without enough cash, never an order from a vendor with an unpaid invoice, and never a price at or below unit cost.
- `desk.date_today` is "today". Cash only goes out, because revenue isn't modeled.
- Customer, landlord, and vendor messages are saved as drafts in `output/drafts.json` and are never sent.
- Every agent step and human decision is appended to `output/audit_trail.json`.

## Output files

| File | Problem | What it is |
|---|---|---|
| `output/harness.md` | 2–9 | Tables, open tickets, all MCP tools, agents, safety, API routes, dashboard, and run results |
| `output/mcp_smoke.json` | 4 | Claude Code calling the first three MCP tools, checked against the database |
| `output/desk_tickets.html` | 6, 9, 10 | Expected plan vs. actual result per ticket, plus Cash and Reflection tabs (open by double-clicking) |
| `output/audit_trail.json` | 5–9 | Append-only log of every agent step and human decision |
| `output/design.md` | 8 | Dashboard design notes |
| `output/resolved_tickets.json` | 9 | Final status, outcome, agent contributions, and approvals per ticket |
| `output/resolved_board.html` | 9 | Real dashboard screenshots after each ticket was resolved (standalone) |
| `output/screenshots/` | 9 | The same screenshots as PNG files |
| `output/drafts.json` | 5–9 | All drafted messages (never sent) |
| `output/github_url.txt` | 11 | This repository's URL |
