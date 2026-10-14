# Campus Customs MCP Server

## What it does

This is a small [FastMCP](https://gofastmcp.com) server, and it's the only way the agents, the dashboard API and Claude Code read or change Campus Customs data. Every tool reads the real database, and none of them invent values.

- **Read tools** open the database read-only.
- **Agents can only propose** payments, purchases and price overrides (`propose_payment`, `propose_purchase`, `propose_price_override`). No cash moves when they do.
- **Only `approve_proposal` moves cash.** It needs a human name plus a secret *human key* that the FastAPI backend creates at startup and gives only to its own copy of this server. Agents never see the key or the tool. Claude Code's copy (started from `../.mcp.json`) has no key, so approve, reject and reset are switched off there.
- **Draft tools** save messages to `../output/drafts.json` with status `draft - NOT sent`. Nothing is ever emailed.

## Database

- Works on `../data/campus_customs_new.db`, the working copy.
- `../data/campus_customs.db` is the original. It's only ever **read**, by `reset_working_database`.
- The `proposals` table exists only in the working copy. The server creates it when it's first needed.

## Tools (20)

### Lookup tools (Problem 3)

| Tool | Input | Tables | What it's for |
|---|---|---|---|
| `check_stock` | `sku`, optional `size` | `inventory` | How many units of a product and size are on the shelf, and where. |
| `get_rent_and_cash` | `lease_id` | `leases`, `cash_accounts`, `desk` | A lease's rent and due date, next to the cash balance and today's date. |
| `get_pricing` | `sku` | `pricing` | A product's unit cost and list price, for checking a discount request. |

### Read tools (Problems 5 and 7)

| Tool | Input | Tables | What it's for |
|---|---|---|---|
| `list_open_tickets` | — | `tickets` | The open ticket queue. |
| `list_tickets` | — | `tickets` | Every ticket with its status (open/resolved). |
| `get_ticket` | `ticket_id` | `tickets` | Every field of one ticket (sku, size, qty, lease_id, invoice_id, notes). |
| `get_shop_date` | — | `desk` | The shop's "today" (`desk.date_today`), used for all due/overdue checks. |
| `list_unpaid_invoices` | optional `vendor_id` | `invoices`, `vendors`, `desk` | Unpaid invoices, with days overdue measured against `desk.date_today`. |
| `list_vendors` | — | `vendors`, `invoices`, `desk` | Each vendor's lead time, its earliest delivery date (today + `lead_days`), and `can_order` (false if it has any unpaid invoice). |
| `get_cash_and_payments` | — | `cash_accounts`, `payments`, `desk` | Cash balances and the payments already made. |
| `list_proposals` | optional `status` | `proposals` | Proposed payments and purchases, and whether each is pending, approved or rejected. |

### Agent action tools (Problems 5 and 7)

| Tool | Input | Tables / files | What it does |
|---|---|---|---|
| `propose_payment` | `kind` (`invoice`/`rent`), `ref_id`, `amount`, `account`, `reason`, `proposed_by`, optional `ticket_id` | reads `invoices`, `leases`, `cash_accounts`; writes `proposals` | Creates a **pending** payment proposal. The amount must match the invoice or rent exactly. It's refused if cash can't cover it or the same payment is already pending. **No cash moves.** |
| `propose_purchase` | `vendor_id`, `sku`, `size`, `qty`, `reason`, `proposed_by`, optional `ticket_id`, `account` | reads `vendors`, `invoices`, `inventory`, `pricing`, `cash_accounts`, `desk`; writes `proposals` | Creates a **pending** restock purchase, costing qty × `unit_cost`. **It's refused if the vendor has any unpaid invoice.** No cash moves. |
| `propose_price_override` | `ticket_id`, `sku`, `size`, `qty`, `unit_price`, `reason`, `proposed_by` | reads `tickets`, `inventory`, `pricing`; writes `proposals` | Creates a **pending** special price (e.g. a bulk discount) for a human to decide. The price must be above `unit_cost` and no higher than `list_price`. **No cash moves**, because revenue isn't modeled (Problem 9). |
| `resolve_ticket` | `ticket_id`, `resolution` | reads `proposals`; writes `tickets.status` | Marks a ticket resolved. It's refused while any proposal for that ticket is pending. |
| `draft_customer_reply` | `ticket_id`, `subject`, `body` | reads `tickets`; writes `output/drafts.json` | Saves a draft to the ticket's requester (customer, student group, or landlord). Not sent. |
| `draft_vendor_message` | `vendor_id`, `subject`, `body`, `is_order`, optional `ticket_id` | reads `vendors`, `invoices`, `desk`; writes `output/drafts.json` | Saves a draft to a vendor, and refuses order drafts while the vendor has an unpaid invoice. No agent uses it since Problem 7; approved purchases create the order draft instead. |

### Human-only tools (Problem 7; need the backend's human key)

| Tool | Input | Tables | What it does |
|---|---|---|---|
| `approve_proposal` | `proposal_id`, `approved_by`, `human_key` | writes `proposals`, `payments`, `cash_accounts`, `invoices` (marked paid) or `leases` (`next_due` + 1 month); reads `vendors`, `desk` | **The only tool that moves cash.** It redoes every check, including whether there's enough cash *now*. An approved purchase also saves a vendor order draft. An approved price override only records the decision. |
| `reject_proposal` | `proposal_id`, `rejected_by`, `human_key`, optional `note` | writes `proposals` | Rejects a pending proposal. No cash moves. |
| `reset_working_database` | `requested_by`, `human_key` | reads `campus_customs.db`; replaces `campus_customs_new.db` | Copies the original over the working copy for a clean start. Drafts and the audit trail are kept. |

If nothing matches, a tool returns an empty result (`[]`, `None`, or `{"ok": false, "reason": ...}`). It never returns made-up values.

`make_payment` from Problem 5 was replaced in Problem 7 by `propose_payment` + `approve_proposal`.

## Who uses it

- **Claude Code**, through `../.mcp.json` (Problem 4). It can use the read, propose and draft tools; the human-only tools are switched off.
- **The agent team** in `../backend/` (Problem 5). Each agent only sees the tools its role needs (see `../output/harness.md`). No agent gets the human-only tools.
- **The FastAPI backend** (`../backend/main.py`, Problem 7). It reads tickets and cash, and its approval and reset routes are the only callers of the human-only tools.

## Files

```
mcp_server/
├── server.py          # the server and all twenty tools
├── requirements.txt   # fastmcp
└── README.md
```

## Setup

```bash
cd mcp_server
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Usually you don't run it yourself; Claude Code and the backend start it. To run it alone, use `.venv/bin/python server.py` (stdio) or `.venv/bin/python server.py --http` (http://127.0.0.1:8001/mcp).

For tests only, `CAMPUS_CUSTOMS_DB` and `CAMPUS_CUSTOMS_DRAFTS` can point the server at scratch copies. `CAMPUS_CUSTOMS_HUMAN_KEY` turns on the human-only tools; the backend sets it automatically.
