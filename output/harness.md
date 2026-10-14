# Campus Customs — Agent Harness

Working database: `data/campus_customs_new.db` (a copy; the original `data/campus_customs.db` stays untouched).

## Contents

1. [Database structure](#1-database-structure)
2. [Open tickets and how they connect](#2-open-tickets-and-how-they-connect)
3. [MCP server tools](#3-mcp-server-tools)
4. [Agent team](#4-agent-team)
5. [All MCP tools (current)](#5-all-mcp-tools-current)
6. [Safety and token control](#6-safety-and-token-control)
7. [Backend API routes](#7-backend-api-routes)
8. [Dashboard features](#8-dashboard-features)
9. [Problem 9: full run results](#9-problem-9-full-run-results)
10. _Add new sections for later problems here_

---

## 1. Database structure

The original database has 9 tables. The working copy gets a 10th, `proposals`, which the MCP server creates the first time an agent proposes something (Problem 7). Only three links are declared as foreign keys:

- `tickets.lease_id` → `leases.id`
- `tickets.invoice_id` → `invoices.id`
- `invoices.vendor_id` → `vendors.id`

`tickets.sku` + `tickets.size` match `inventory` (and `tickets.sku` matches `pricing`) by value. Those links aren't declared as foreign keys.

### desk
| Field | Type | Notes |
|---|---|---|
| date_today | TEXT | required |
| notes | TEXT | |

**Why it matters:** It sets the shop's "today" (2026-08-31), which the agents need to tell whether something is due or overdue.

### inventory
| Field | Type | Notes |
|---|---|---|
| sku | TEXT | primary key (with size) |
| name | TEXT | required |
| size | TEXT | primary key (with sku) |
| qty | INTEGER | required |
| location | TEXT | required |

**Why it matters:** It shows how many of each item and size are on the shelf, so the agents can check whether an order can be filled.

### pricing
| Field | Type | Notes |
|---|---|---|
| sku | TEXT | primary key |
| unit_cost | REAL | required |
| list_price | REAL | required |

**Why it matters:** It gives each item's cost and selling price, so the agents can check whether a discount still makes money.

### vendors
| Field | Type | Notes |
|---|---|---|
| id | INTEGER | primary key |
| name | TEXT | required |
| specialty | TEXT | required |
| lead_days | INTEGER | required |

**Why it matters:** It lists who the shop can buy from and how many days each vendor takes, so the agents know who can restock and how fast.

### leases
| Field | Type | Notes |
|---|---|---|
| id | INTEGER | primary key |
| space_name | TEXT | required |
| landlord | TEXT | required |
| monthly_rent | REAL | required |
| next_due | TEXT | required |
| notes | TEXT | |

**Why it matters:** It holds the shop's rent amount and next due date, so the agents can check a rent notice against the real lease.

### cash_accounts
| Field | Type | Notes |
|---|---|---|
| name | TEXT | primary key |
| balance | REAL | required |
| date | TEXT | required |

**Why it matters:** It shows how much money the shop has right now, so the agents don't approve payments the shop can't afford.

### payments
| Field | Type | Notes |
|---|---|---|
| id | INTEGER | primary key |
| kind | TEXT | required |
| ref_id | INTEGER | no declared foreign key |
| amount | REAL | required |
| account | TEXT | required |
| paid_at | TEXT | required |
| approved_by | TEXT | required |

**Why it matters:** It records each payment and who approved it, which gives the agents a paper trail. The table is empty right now.

### invoices
| Field | Type | Notes |
|---|---|---|
| id | INTEGER | primary key |
| vendor_id | INTEGER | foreign key → `vendors.id` |
| amount | REAL | required |
| due_date | TEXT | required |
| status | TEXT | required |
| description | TEXT | |

**Why it matters:** It lists the bills the shop owes to vendors, with due dates and paid/open status, so the agents know what's outstanding.

### tickets
| Field | Type | Notes |
|---|---|---|
| id | INTEGER | primary key |
| type | TEXT | required |
| requester | TEXT | required |
| subject | TEXT | required |
| sku | TEXT | matches `inventory` / `pricing` by value |
| size | TEXT | matches `inventory` by value |
| qty | INTEGER | |
| lease_id | INTEGER | foreign key → `leases.id` |
| invoice_id | INTEGER | foreign key → `invoices.id` |
| status | TEXT | required |
| notes | TEXT | |
| created_at | TEXT | required |

**Why it matters:** It's the agents' inbox. Each ticket is a request to handle and points to the item, lease, or invoice it's about.

### proposals (working copy only; added in Problem 7)
| Field | Type | Notes |
|---|---|---|
| id | INTEGER | primary key |
| kind | TEXT | `invoice`, `rent`, `purchase`, or `price_override` |
| ref_id | INTEGER | invoices.id / leases.id / vendors.id / tickets.id, depending on `kind` |
| sku, size, qty | TEXT, TEXT, INTEGER | purchases and price overrides |
| unit_price | REAL | price overrides only (added in Problem 9) |
| amount | REAL | cash that leaves the account if approved (0 for a price override) |
| account | TEXT | the cash account to pay from |
| ticket_id | INTEGER | the ticket it serves |
| reason | TEXT | the agent's one-line case for approving |
| proposed_by | TEXT | which agent proposed it |
| status | TEXT | `pending` → `approved` or `rejected` |
| created_at, decided_by, decided_at | TEXT | who decided and when |
| payment_id | INTEGER | the `payments` row an approval created |
| note | TEXT | rejection note |

**Why it matters:** It's the line between agents and money. Agents can only add `pending` rows; only a human's approval turns one into a payment.

---

## 2. Open tickets and how they connect

All 3 tickets are `open`, and all were created on 2026-08-31 (the desk date).

### Ticket 101 — `customer_order`
Tauhid Zaman wants 1 × `CC-TEE-WHITE` (Classic Bulldog Tee), size S.

| Linked table | What it shows |
|---|---|
| inventory | Size S: **0 in stock** (Aisle B) |
| pricing | Cost $8.00, list price $28.00 |
| invoices (via `invoice_id` 501) | $840.00, "Rush reprint CC-TEE-WHITE S", due 2026-08-28, status `open` (3 days past the desk date) |
| vendors (via invoice `vendor_id` 1) | Bulldog Print Co, apparel reprint, 5 lead days |

### Ticket 102 — `rent_notice`
Elm City Properties emailed that the rent is due in 2 days.

| Linked table | What it shows |
|---|---|
| leases (via `lease_id` 1) | Chapel Street shop, landlord Elm City Properties, $2,400.00/month, next due 2026-09-02 |
| cash_accounts | Checking: $3,400.00 as of 2026-08-31 |
| payments | No payments recorded |

### Ticket 103 — `price_override`
Yale AI Club wants 20 × `CC-HOOD-NAVY` (Basic Hoodie Big Yale), size M, and is asking for a bulk discount.

| Linked table | What it shows |
|---|---|
| inventory | Size M: **8 in stock** (Aisle A); all hoodie sizes together: 32 |
| pricing | Cost $22.00, list price $58.00 |

### How the tickets affect each other
- Tickets 101 and 102 both draw on the same checking account. Rent ($2,400) plus invoice 501 ($840) comes to $3,240, and checking has $3,400.
- Ticket 101's out-of-stock tee is tied to an unpaid reprint invoice from Bulldog Print Co.
- Ticket 103 asks for more size M hoodies (20) than are in stock (8).

---

## 3. MCP server tools

Server: `mcp_server/server.py` (FastMCP). It reads `data/campus_customs_new.db` and opens the database read-only.

| Tool | Reads table(s) | Helps with ticket | Why it's useful |
|---|---|---|---|
| `check_stock(sku, size)` | `inventory` | **101** | It shows the size S tee has 0 in stock, so the agent knows the order can't be filled from the shelf. |
| `get_rent_and_cash(lease_id)` | `leases`, `cash_accounts`, `desk` | **102** | It checks the landlord's email against the real lease ($2,400 due 2026-09-02) and shows whether checking ($3,400) can cover it. |
| `get_pricing(sku)` | `pricing` | **103** | It shows the hoodie costs $22 and sells for $58, so the agent knows how much room there is for a bulk discount. |

**Extra use:** `check_stock` also helps with 103, since it shows only 8 size M hoodies for a request of 20.

**Not covered by a tool yet:** `tickets`, `invoices`, `vendors` and `payments`. That includes invoice 501 (the $840 reprint linked to ticket 101).

---

## 4. Agent team

Code: `backend/` (PydanticAI). Every agent uses **gpt-6-luna via Portkey** (`PORTKEY_API_KEY`). Agents get shop data **only** through the MCP server, started from `.mcp.json`, and each agent sees only the tools listed for it.

How to run it:
- From the dashboard API: section 7.
- From the terminal: `.venv/bin/python -m backend.cli`.

| Agent | Role | MCP tools it can use | Can delegate to | Prompt |
|---|---|---|---|---|
| **Boss** | Reads the queue, routes each ticket, resolves finished tickets, and writes the shift report | `list_open_tickets`, `get_ticket`, `get_shop_date`, `list_proposals`, `resolve_ticket` | Inventory, Accounting, Facilities, Customer Service | `backend/prompts/boss.md` |
| **Inventory** | Stock, cost/price, vendors, lead times; can **propose** restock purchases and price overrides | `get_ticket`, `get_shop_date`, `check_stock`, `get_pricing`, `list_vendors`, `list_proposals`, `propose_purchase`, `propose_price_override` | — | `backend/prompts/inventory.md` |
| **Accounting** | Cash, invoices, payments; the only agent that can **propose** a payment | `get_ticket`, `get_shop_date`, `get_cash_and_payments`, `list_unpaid_invoices`, `get_rent_and_cash`, `list_proposals`, `propose_payment` | — | `backend/prompts/accounting.md` |
| **Facilities** | Lease and rent notices; checks the landlord's notice against the lease | `get_ticket`, `get_shop_date`, `get_rent_and_cash`, `draft_customer_reply` | Accounting | `backend/prompts/facilities.md` |
| **Customer Service** | Draft replies to customers and student groups | `get_ticket`, `get_shop_date`, `check_stock`, `get_pricing`, `draft_customer_reply` | Inventory | `backend/prompts/customer_service.md` |

**How they talk:**
- Agents delegate with a `delegate` tool. The caller sends one task with the ticket fields, and the specialist returns a structured `AgentReport` (`backend/models.py`) listing its facts (each with a source tool), confirmed actions, human decisions, and blockers.
- Boss returns a `ShiftReport`.
- Delegation can go at most 2 levels deep (Boss → specialist → one peer).

**Audit trail:** `output/audit_trail.json`.
- Every agent-loop step appends one record: agent, who called it, step, what it did, what it `said`, `delegated`/`delegated_to`, `used_tool`/`tools_called`, tool results (shortened), and tokens.
- Human approvals, rejections and resets are recorded too, without the human key.
- Records are only appended, never deleted.

---

## 5. All MCP tools (current)

| Tool | Database table(s) it uses | Read / write | Who can call it | Added in |
|---|---|---|---|---|
| `check_stock` | `inventory` | read | agents | Problem 3 |
| `get_rent_and_cash` | `leases`, `cash_accounts`, `desk` | read | agents | Problem 3 |
| `get_pricing` | `pricing` | read | agents | Problem 3 |
| `list_open_tickets` | `tickets` | read | agents | Problem 5 |
| `get_ticket` | `tickets` | read | agents, API | Problem 5 |
| `get_shop_date` | `desk` | read | agents | Problem 5 |
| `list_unpaid_invoices` | `invoices`, `vendors`, `desk` | read | agents | Problem 5 |
| `list_vendors` | `vendors`, `invoices`, `desk` | read | agents | Problem 5 |
| `get_cash_and_payments` | `cash_accounts`, `payments`, `desk` | read | agents, API | Problem 5 |
| `draft_customer_reply` | `tickets` (read); saves to `output/drafts.json`, not the DB | draft only | agents | Problem 5 |
| `draft_vendor_message` | `vendors`, `invoices`, `desk` (read); saves to `output/drafts.json`, not the DB | draft only | Claude Code (no agent uses it since Problem 7) | Problem 5 |
| `list_tickets` | `tickets` | read | API | Problem 7 |
| `list_proposals` | `proposals` | read | agents, API | Problem 7 |
| `propose_payment` | `invoices`, `leases`, `cash_accounts` (read); `proposals` (write) | proposal, **no cash moves** | Accounting | Problem 7 |
| `propose_purchase` | `vendors`, `invoices`, `inventory`, `pricing`, `cash_accounts`, `desk` (read); `proposals` (write) | proposal, **no cash moves** | Inventory | Problem 7 |
| `propose_price_override` | `tickets`, `inventory`, `pricing` (read); `proposals` (write) | proposal, **no cash moves** | Inventory | Problem 9 |
| `resolve_ticket` | `proposals` (read); `tickets.status` (write) | write | Boss | Problem 7 |
| `approve_proposal` | `proposals`, `payments`, `cash_accounts`, `invoices`/`leases` (write); `vendors`, `pricing`, `desk` (read) | **moves cash** (payments/purchases); records the decision only for price overrides | approval route only (needs human key) | Problem 7 |
| `reject_proposal` | `proposals` (write) | write | approval route only (needs human key) | Problem 7 |
| `reset_working_database` | copies `data/campus_customs.db` (read only) over `data/campus_customs_new.db` | write | reset route only (needs human key) | Problem 7 |

In Problem 7, `make_payment` (added in Problem 5) was replaced by the propose → approve flow. The new `proposals` table lives only in the working database. The server creates it when it's first needed, and a reset removes it.

**Why the tools exist (based on the tickets):**
- **101:** the tee is out of stock, and its reprint vendor has the overdue invoice 501. That's why there are invoice and vendor tools, and why purchases from vendors with unpaid invoices are refused.
- **102:** rent needs a payment that a human approves: `propose_payment`, then `approve_proposal`.
- **103:** the discount request needs cost, price and stock. There's no discount policy in the database, so the discount goes to a human as a `propose_price_override` proposal (Problem 9). The human approves or rejects it, and the agents quote the decision.

**How the shop rules are enforced:**

| Rule | Where it's enforced |
|---|---|
| Use `desk.date_today` for overdue checks | `get_shop_date`; `list_unpaid_invoices` computes `days_overdue` from it |
| Check vendor lead times in `vendors` | `list_vendors` (`lead_days`, `earliest_delivery`); `propose_purchase` returns the delivery date |
| Never order from a vendor with an unpaid invoice | `list_vendors.can_order`; `propose_purchase` and `approve_proposal` both refuse |
| Payments always need a human | Agents can only propose. `approve_proposal` needs the human key, which only the backend's approval route has, plus a human name (agent names are refused) |
| Discounts need a human, never below cost | `propose_price_override` only accepts a price above `unit_cost` and ≤ `list_price`; it stays pending until a human decides |
| No payment without enough cash | `propose_payment`/`propose_purchase` check the balance, and `approve_proposal` checks again at approval time |
| Cash only goes out | Only `approve_proposal` changes cash, and it only subtracts; there's no deposit tool |
| Messages are drafted, never sent | `draft_*` tools and approved purchases only save to `output/drafts.json` |

---

## 6. Safety and token control

**Guardrails a real business would need when agents handle customers and money:**
- **Humans approve money.** Agents can only propose payments and purchases. A person approves them in the dashboard, and the server re-checks amounts, cash, vendor rules and duplicates at that moment. A real shop would also want logged-in approvers (here, a typed name is trusted), spending limits, and a second approver for large payments.
- **Least privilege.** Each agent only sees the tools its role needs. The tools that move cash or reset the database are hidden from every agent and also need a secret key that agents never see.
- **Nothing goes out automatically.** Emails, landlord replies and vendor orders are drafts that a person reviews before sending.
- **Facts come from data, not the model.** Agents must cite the tool behind each fact. Customers never see costs, margins, or internal problems.
- **Prices are human decisions too.** A discount is a proposal the server checks (above cost, not above list). Customers are only quoted a special price after a human approves it.
- **Fraud checks.** Facilities compares any rent notice against the lease. A different landlord, amount, or bank detail is a red flag, and nothing gets paid.
- **Full audit trail.** It records who did what, who delegated, which tools were used, and who approved or rejected each proposal. It's append-only, so history can't be rewritten.
- **Test safely.** Tests run against scratch copies of the database. Reset only reads the original.

**Keeping token usage under control:**
- One shared budget per run: at most 60 model requests and 400,000 tokens across all agents (`UsageLimits`). If it's exceeded, the run stops.
- Delegation depth is capped at 2, so agents can't bounce work around forever.
- Each agent sees only its own tools, so it gets fewer tool descriptions in every request.
- Prompts tell agents to send one clear task per delegation, avoid repeat lookups, and keep reports short.
- Tools return compact, focused results, and the audit trail stores shortened previews.
- The dashboard runs one ticket at a time, and only one run can go at once.
- Model calls time out after 120 seconds (with 2 retries) instead of hanging.
- Examples:
  - The full 3-ticket run (Problem 5) used 29 requests and about 61k input / 7k output tokens.
  - Ticket 102 alone through the API (Problem 7) used 11 requests and about 25k input / 2.4k output tokens.

---

## 7. Backend API routes

Start it from `backend/` with `source ../.venv/bin/activate`, then `uvicorn main:app --reload --port 8000`. Interactive docs are at http://127.0.0.1:8000/docs. CORS allows the React dashboard at `http://localhost:5173`; add more origins with `FRONTEND_ORIGINS`.

- `GET /api/health` — says the API is up, which model it uses, which database it works on, and whether a run is going.
- `GET /api/tickets` — all tickets (101, 102, 103), each with `open`/`resolved` status, its pending proposal ids, and its latest dashboard run.
- `GET /api/tickets/{ticket_id}` — every field of one ticket.
- `POST /api/tickets/{ticket_id}/resolve` — body `{"resolved_by": "Your Name"}`. A human marks the ticket resolved (added for the dashboard in Problem 8). It's refused while any proposal for it is pending.
- `POST /api/tickets/{ticket_id}/run` — starts the agent team on that ticket in the background and returns a `run_id` right away. It's refused if the ticket is resolved or another run is going.
- `GET /api/runs` — every run started since the server began, newest first.
- `GET /api/runs/{run_id}` — one run's status (`running`/`finished`/`failed`), with the Boss's report and token usage when it's done.
- `GET /api/events?since=N&limit=50&run_id=…&ticket_id=…` — recent agent events from the audit trail: which agent, what it did, what it said, which tools it used, and who it delegated to. Poll it with `since=next_since` to get only new events; `ticket_id` limits it to one ticket.
- `GET /api/approvals?status=pending` — proposed payments and purchases waiting for a human (or `approved`, `rejected`, `all`).
- `POST /api/approvals/{proposal_id}/approve` — body `{"approved_by": "Your Name"}`. A human approves, and this is the **only route that changes the cash balance**. It's refused if cash is short or a rule fails.
- `POST /api/approvals/{proposal_id}/reject` — body `{"rejected_by": "Your Name", "note": "…"}`. Rejects a proposal, and no cash moves.
- `GET /api/cash` — the checking balance from `cash_accounts`, the total of pending proposals, and recent payments.
- `POST /api/reset` — copies the original `data/campus_customs.db` over `data/campus_customs_new.db` for a clean start. The original is only read. It's refused while a run is going.

---

## 8. Dashboard features

React + Vite + TypeScript in `frontend/`. Start it with `npm run dev`, then open http://localhost:5173 (`?ticket=102` opens a ticket directly). Design notes are in `output/design.md`.

| Feature | What you see | Backend route(s) |
|---|---|---|
| Ticket queue | Tickets 101–103 as paper tickets, with Open / Agents working / N to approve / Resolved pills and a RESOLVED stamp | `GET /api/tickets` |
| Start the team | **Start agent team** / **Run agents again** on the selected ticket; one run at a time | `POST /api/tickets/{id}/run`, `GET /api/runs/{run_id}` |
| Live activity | Agent roster (working / reported / not needed), plus a feed of each agent's words, tool calls and delegations, refreshed every 1.2 s while running | `GET /api/events?ticket_id=…&since=…` |
| Agent summaries | One card per agent with its final report; the Boss card shows the outcome | `GET /api/events`, `GET /api/runs/{run_id}` |
| Approvals | Sign-off slips for proposed payments, purchases and price overrides, with Approve (signed with your name) or Reject (with a note) | `GET /api/approvals`, `POST /api/approvals/{id}/approve`, `…/reject` |
| Cash | Checking balance that glides to its new value after an approval, a pending bar, and a payments ledger | `GET /api/cash` |
| Resolve | Tickets resolve when the Boss calls `resolve_ticket`; **Mark resolved** is a human fallback once nothing is pending | `POST /api/tickets/{id}/resolve` |
| Reset | **Reset day** (with a confirmation dialog) restores the working DB from the original | `POST /api/reset` |
| Errors | Offline banner with the start command, toasts with the server's reasons, buttons disabled with a hint | all |

---

## 9. Problem 9: full run results

The full system was run on a clean working database through the React dashboard on 2026-10-14 (desk date 2026-08-31). Every ticket was **resolved by the Boss's `resolve_ticket`**, never marked by hand. Every payment, purchase and price was approved on a sign-off slip, signed "Madina Muratova (via Claude Code)".

| Ticket | Runs | Human approvals | Checking when resolved |
|---|---|---|---|
| 101 tee order | 3 | #1 invoice 501 −$840.00 (overdue, blocked the reprint); #2 restock 1 × CC-TEE-WHITE S −$8.00 | $2,552.00 |
| 102 rent | 2 | #3 rent for lease 1 −$2,400.00 (verified against the lease) | $152.00 |
| 103 bulk hoodies | 2 | #4 price override: 8 × CC-HOOD-NAVY M at $52.00 (no cash moves). The 12-hoodie restock ($264) was refused by the server for lack of cash | $152.00 |

**Cash:** start $3,400.00 − 840.00 − 8.00 − 2,400.00 = **$152.00**, which matches `cash_accounts`.

**Fixes the pre-run dry run forced:**
- **101 could never resolve.** The Boss never asked Inventory to propose a restock, so it now does.
- **103 could never resolve.** There was no way for a human to decide a discount, so I added `propose_price_override` and price slips in the dashboard.

**Where the details are:**
- `output/desk_tickets.html`: Actual sections and the Cash tab.
- `output/resolved_tickets.json`
- `output/resolved_board.html`, with screenshots also in `output/screenshots/`.
- New audit records appended to `output/audit_trail.json` (131 → 434; the old ones are untouched).

---

## Update log
- **Problem 2:** Added the database structure and the open ticket connections.
- **Problem 3:** Added the three MCP server tools.
- **Problem 5:** Added the agent team, the full current MCP tool list (nine new tools), how the shop rules are enforced, and the safety/token section.
- **Problem 7:** Added the FastAPI routes (section 7). Payments and purchases are now propose → human approve, and `make_payment` is gone. Added tools for tickets, proposals, approvals and reset, and updated sections 4–6 to match.
- **Problem 8:** Added the resolve route and the `ticket_id` filter on events for the React dashboard (`frontend/`). Design notes are in `output/design.md`.
- **Problem 9:** Added the proposals table, the price-override tool (20 tools), dashboard features (section 8), and the full-run results (section 9).
