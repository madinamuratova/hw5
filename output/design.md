# Campus Customs Operations Desk: design notes

The dashboard (`frontend/`, React + Vite + TypeScript) is the human side of the agent team. It shows the three tickets and lets you start the team on one and watch it work. It's also where you sign off on payments, and it shows the checking account at all times. Everything on screen comes from the FastAPI routes in Problem 7. Nothing is mocked.

**Running it:**

1. Start the backend from `backend/`: `source ../.venv/bin/activate` then `uvicorn main:app --reload --port 8000`.
2. Start the frontend from `frontend/`: `npm install` (first time only), then `npm run dev`.
3. Open http://localhost:5173.

---

## 1. The idea: a desk, not a page

The design is based on a real shop's back-office desk: a stack of paper tickets on the left, the ticket you're working on in front of you, and the money (cash drawer and sign-off slips) on the right. Every visual choice follows from that:

- **Tickets look like paper desk tickets**, with a numbered stub, a perforated edge, and notches where they'd be torn.
- **Resolved tickets get a rubber stamp.** A tilted "RESOLVED" stamp lands on the ticket with a small press animation.
- **Approvals are sign-off slips.** Each one shows the amount in large serif numerals and a signature line with your name in italic, like signing a cheque.
- **Cash reads like a ledger.** There's one large serif balance and a short list of payments below it.

The style follows the course's Scandinavian default: warm paper background (`#f4f1ea`), ink text, generous whitespace, thin lines, and soft shadows. There are no gradients for decoration and only a few accent colours.

## 2. Layout

```
┌──────────────────────────── top bar ─────────────────────────────┐
│ CC Campus Customs · desk date · model · ● Backend live · ✎ name · Reset day │
├──────────────┬─────────────────────────────────────┬──────────────┤
│ Ticket queue │ Selected ticket card                │ Checking     │
│  ▸ No. 101   │  title · requester · notes · facts  │  $3,400.00   │
│  ▸ No. 102   │  [Start agent team] [Mark resolved] │  pending bar │
│  ▸ No. 103   │ "Waiting on you" callout            │  payments    │
│              │ Agent roster (5 avatars)            ├──────────────┤
│  (sticky)    │ Agent activity (live feed)          │ Approvals    │
│              │ What each agent did (summaries)     │  slips       │
└──────────────┴─────────────────────────────────────┴──────────────┘
```

- **Three columns at desktop width:**
  - Left, the **queue**. It's sticky, so you can switch tickets at any time.
  - Centre, the **work surface**.
  - Right, the **money**. It's sticky too, so the balance and approvals stay in view while you read the feed.
- **Responsive:**
  - Below ~1220px, the money column moves under the work surface as two side-by-side cards.
  - Below ~820px, everything stacks into one column (tested at 375px with no sideways scrolling).
- **Top bar:**
  - Shows the shop's **desk date** (from `desk.date_today`, not the computer clock), the agents' model, and a live/offline connection pill.
  - Has a name field ("Your name to sign"). Every approval, rejection and resolve is signed with it, and it's remembered in the browser.
  - Has **Reset day**, which asks for confirmation in a dialog first.

## 3. Tickets and their status

Each ticket in the queue shows its number on the stub, its type with an icon (tee for orders, key for rent, tag for price overrides), the subject, the requester, and status pills:

| Pill | Meaning |
|---|---|
| **Open** (navy tint) | `tickets.status = 'open'` |
| **Agents working** (solid navy, pulsing dot) | a run is going on this ticket right now |
| **N to approve** (ochre) | the ticket has pending proposals |
| **Resolved** (green) + stamp | `tickets.status = 'resolved'` |

The selected ticket's stub turns navy, so you always know where you are.

**How tickets become resolved.** When a run finishes, the dashboard reloads the ticket status straight away.
- **Agents resolve it:** if the Boss could resolve it (nothing waiting on a human), it arrives already **RESOLVED**, with the stamp and a toast.
- **Still open:** a **"Waiting on you"** callout lists exactly what's left: pending proposals (each links to its slip) and the human decisions from the Boss's report, such as a discount decision. A **Mark resolved** button appears. It stays disabled until every proposal for the ticket is approved or rejected, and the server refuses it anyway if one is still pending.
- **Once resolved:** the Start button locks ("Resolved. Reset the day to work it again.").

## 4. How each agent's activity is shown

**The roster.** Five avatars, one per agent, each in its own muted colour: Boss slate, Inventory moss, Accounting ochre, Facilities clay, Customer Service lake blue.
- **Working** agents have a soft "breathing" ring.
- **Agents that reported back** get a small green check.
- **Agents that weren't involved** fade to "Not needed" when the run ends. You can see at a glance that the Boss didn't send everyone to everything (e.g. ticket 102 used only Boss, Facilities and Accounting).

**The live feed (Story view).**
- **Polling:** it reads `GET /api/events?ticket_id=…` once, then, while a run is live, asks every 1.2 s for only the new events (`since=next_since`).
- **Each row** is one agent step, with the agent's avatar, its name in its colour, a verb and the time:
  - *"joined · asked by Boss"*, with the task it was given quoted underneath.
  - *"used tools"*, with mono chips like `check_stock(CC-TEE-WHITE, S)`. Hovering a chip shows the full arguments.
  - *"delegated"*, with a chip like **→ Facilities** and a one-line hint of the task.
  - *"reported back"*, with the agent's summary in a card edged in its colour.
  - Anything the model said is shown in serif italics, like a quote.
- **Delegation depth is indented.** A specialist's steps sit one step in, with a thin line in its colour, and a peer it consulted sits two steps in. So Boss → Facilities → Accounting reads as a little thread.
- **Run start and end** are marked with dividers. The end divider shows model calls, tool calls and tokens used.
- **Your own decisions** (approve, reject, resolve) appear in the same feed as green "You" rows.
- **While live:** typing dots sit at the bottom and the feed follows new events, unless you've scrolled up to read.
- **Every step view.** A toggle shows the raw audit trail, including each tool's (shortened) result. That's handy for checking the agents against the database.
- **Earlier runs** fold into an "Earlier activity" section, so the current run stays front and centre.

**What each agent did.** Under the feed, one card per agent holds its final report for the latest run. The Boss's card spans the full width and shows the outcome pill (Handled / Waiting on you / Blocked), its summary, and the actions it confirmed. Agents that weren't needed show a dashed "Not needed for this ticket." card.

## 5. Approvals and the cash balance

**Sign-off slips** (right column). Every pending proposal gets a slip showing:
- what it is (e.g. "Rent · lease 1", "Invoice #501", "Restock · 4 × CC-TEE-WHITE S") and which ticket it's for;
- the amount, in large serif numerals;
- who proposed it and their reason;
- **"Checking after approval: $1,000.00"**, so you see the effect before you sign. If there isn't enough cash, the slip turns red, says so, and disables Approve. The server re-checks either way;
- a signature line showing the name you'll sign with.

**Approve** calls `POST /api/approvals/{id}/approve`, the only route that moves cash. **Reject** opens an optional note first. Decided slips move into a collapsible "Decided" list. If the server refuses (e.g. "Not enough cash"), its reason appears on the slip and in a toast.

**The checking card.**
- **The balance** is one large serif number in tabular figures. After an approval, it **glides** to the new value over about a second, and a **"−$2,400.00"** chip flashes beside it. Red means money out; green appears only when a reset puts money back.
- **A meter** shows the balance split into "free" (green) and "waiting for approval" (striped ochre), with *If everything is approved* beneath it.
- **A short ledger** lists every payment with who approved it. A footnote reminds you that revenue isn't modeled, so cash only goes out.

## 6. Loading states and errors

- **Loading:**
  - Skeleton shimmer while the queue, cash and approvals load.
  - Spinners inside the buttons that are working (Starting…, Paying…).
  - A live timer on the Start button while agents run.
- **Disabled, with a reason:** buttons are disabled with a hint instead of failing.
  - "Ticket 101 is being worked on. One run at a time keeps cash checks honest."
  - "Approve or reject the pending proposal first."
  - "Waiting for the backend to come back…"
- **Toasts** for every outcome: run started, run finished (resolved / needs you / failed), paid, rejected, reset, and errors with the server's own message (FastAPI's `detail`).
- **Backend offline:**
  - A red banner shows the exact command to start it (`uvicorn main:app --reload --port 8000`), and the connection pill turns red.
  - The last known data stays on screen, and the desk reconnects on its own.
- **Signing:** approving or resolving without a name puts focus in the name field with a gentle "Sign in first".
- **Refreshing:**
  - The desk refreshes every 6 s.
  - Polling pauses while the browser tab is hidden, to save requests.
  - A run that's already going is picked up again after a page reload.

## 7. What makes it pleasant to use

- **You can follow the work.** The roster breathes, the feed reads top to bottom like a conversation, and delegation is visible as indentation. You can tell who is doing what without reading JSON.
- **Money is calm and explicit.** Every slip tells you the balance afterwards, approval asks for your name, and the balance glides instead of jumping, so you notice the change.
- **Finishing feels finished.** The rubber stamp, the green check on each agent who reported, and the toast make "resolved" feel like an event.
- **Nothing is hidden, nothing is noisy.** Story view shows the important steps; one click on "Every step" shows the whole audit trail.
- **Accessible by default:**
  - Status is shown in text as well as colour.
  - Live regions announce changes.
  - The focus ring is visible.
  - The reset dialog is native (Escape closes it).
  - Motion turns off when the system asks for reduced motion.

## 8. Small backend additions for the dashboard

- **Mark resolved:** `POST /api/tickets/{id}/resolve` lets a human mark a ticket resolved. It's refused while a proposal is pending, and it's logged in the audit trail.
- **Per-ticket events:** audit records from dashboard runs now carry `ticket_id`, and `GET /api/events` accepts `ticket_id=`.
- **Last run survives restarts:** `GET /api/tickets` recovers each ticket's last run from the audit trail if the backend restarted, and ignores runs from before the latest reset.
- **CORS:** allows `http://localhost:5173` and `http://127.0.0.1:5173` (plus `4173` for `vite preview`). More origins can be added with `FRONTEND_ORIGINS`.
