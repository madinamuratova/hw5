# HW 5 — AI Prompts Log

## Problem 1: Vibe coder prompts

### First prompt

> hii lets do hw 5. for that first, create a file called AI_prompts.md in the HW 5 assignment folder. i need this file to keep track of the prompts I use for each homework problem. Set it up with a heading for Problem 1: Vibe coder prompts and include a short placeholder for my first prompt and a follow-up prompt, with one sentence explaining what was missing after the first prompt. Keep it simple and organized. Don't start working on the actual assignment yet, and don't invent any prompts I haven't used. I'll update the file as I go.

### Follow-up prompt

> None. The first prompt did what I needed, so I didn't send a follow-up for Problem 1.

**What was missing after the first prompt:** Nothing: it created AI_prompts.md with the Problem 1 heading and the placeholders exactly as I asked.

## Problem 2: Database inspection

### Prompt

> nowww pls help me with problem 2. open data/campus_customs.db and inspect every table and its fields so I can understand how the database is structured. first, make a copy of the original database called data/campus_customs_new.db and keep the original file untouched.
> then look at the three open tickets and check how they connect to the other tables. create output/harness.md and for every table, list its fields and add one short sentence explaining why the table is important for the agents. please use the actual database structure instead of guessing anything, and keep the explanations simple and easy to understand. I will add more stuff to this harness file in later problems, so make sure it is organized and easy to update. also, update AI_prompts.md to record the prompt I used for problem 2.

## Problem 3: MCP server

### Prompt

> now we do problme 3 which is building the MCP server. create the server inside mcp_server/ using FastMCP, and make it work with data/campus_customs_new.db . for now, I only need the server code and the tools so don't try to connect or run the server yet. look at the database and the three open tickets (101, 102, and 103) to figure out which three tools would be useful for handling them. create three tools with clear names that agents can use to get the information they need. Make sure each tool reads the real data from the database and doesn't make up any information. after that, update output/harness.md with the three tools. for each one, include which table it reads, which ticket it helps with (101, 102, or 103) and a short sentence explaining why the tool is useful for that ticket.
> also create mcp_server/README.md explaining what the MCP server does, which database file it uses and what the three tools are for. keep everything simple and organized and update AI_prompts.md with the prompt I used for Problem 3.

## Problem 4: Connect the MCP server to Claude Code

### Prompt

> for problm 4 i need to connect the MCP server we created in problem 3 to Claude Code so I can call and test the tools directly from this project. First check the existing MCP server setup and figure out how to connect it properly. Add the connection configuration to .mcp.json in the project root, using the correct paths and commands for this project. Make sure it uses the MCP server we already built and the working database data/campus_customs_new.db -- after connecting it, test each of the three MCP tools separately by asking Claude Code to call them. for each test, save the prompt I used, the tool name and the actual output returned by the tool. put all the results in output/mcp_smoke.json and make sure the outputs match the real data in the working database. please don't make up outputs or just write what you expect the tools to return actually test them and record the results. if the connection doesn't work, check the setup and fix it before continuing. Keep the changes focused on problem 4,  Also update `AI_prompts.md` with the prompt I used for this problem. Don't overwrite any existing work from the earlier problems.

## Problem 5: Agent team

### Prompt

> okaay now help me with problem 5. I need to build the full agent team for campus customs using PydanticAI. Before changing anything, look at the code and files we already have from the previous problems so you can build on them instead of starting over. create five agents: Boss, Inventory, Accounting, Facilities, and Customer Service. Give each agent its own prompt file in backend/prompts/, with clear instructions about its role, what it can do, and the shop rules it needs to follow. Please make the prompts detailed and specific to this assignment, not just generic AI instructions. The agents should be able to delegate work to each other and communicate properly. Put shared data types in backend/models.py and organize the agent code under backend/ so the five roles are easy to understand.for every agent, use only the gpt-6-luna model through Portkey with PORTKEY_API_KEY. Don't use other models or add a separate layer of shop tools that bypasses the MCP server. The agents should get shop information and use tools through our existing MCP server, and you can add more MCP tools if the tickets need them. Check the actual database and open tickets 101, 102, and 103 to decide what extra tools are needed. Never invent shop data or assume something is in the database without checking.
> make sure the agents follow the shop rules: use desk.date_today for overdue checks, check vendor lead times from the vendors table, and never order from a vendor with an unpaid invoice. Payments must always require human approval, and no payment should be allowed if there isn't enough cash. Since revenue isn't modeled, cash should only go out. Customer emails and vendor messages should only be drafted, not actually sent. I also need an audit trail. Set up output/audit_trail.json so every agent-loop step appends a record showing enough information to understand what happened, which agent was involved, what it did, and whether it delegated work or used a tool. Append new records instead of deleting existing ones each time the system runs. Then update output/harness.md with a list of all five agents and every MCP tool, including any new tools you add. For each tool, say which database table it uses. Add a short safety section explaining the guardrails a real business would need when agents handle customers and money, and how we can keep token usage under control. update mcp_server/README.md so it includes the full, current list of MCP tools. Keep the existing work from earlier problems intact, update AI_prompts.md with the prompt for Problem 5, and focus only on this problem for now. test the important parts as you go and tell me if anything doesn't work rather than pretending it does.

## Problem 6: Desk tickets plan

### Prompt

> okaaay now lets deal with Problem 6 then. before we connect everything in the backend and run the agents, I need to plan how the team should handle the three open tickets (101, 102, and 103).create `output/desk_tickets.html` as a simple HTML page that I can open directly in my browser by double-clicking it. It should have separate tabs for tickets 101, 102, and 103, plus Cash and Reflection tabs for later problems. For now, the Cash and Reflection tabs can be blank or just say "Coming later". for each ticket tab, add an Expected section and leave a separate Actual section empty for now, because I will fill it in after running the agents. In the Expected section, explain in my own words:
>
> * Which agent the Boss should call first and why.
> * Which other agents should get involved, in what order, and what each one should do. Don't send every agent to every ticket if they aren't needed.
> * Which MCP tools should be used during the process and why they are relevant. first, inspect the real database, the open tickets, the agent prompts, and the available MCP tools so the plans are based on actual information and not guesses. Make each ticket's plan specific to its situation, and explain the expected delegations step by step instead of just saying the Boss should call everyone.
>
> Keep the HTML simple and readable, with working tabs and no need for a separate server to open it. Update `AI_prompts.md` with the prompt I used for Problem 6, and don't overwrite any work from the previous problems. Don't start running the agents yet

## Problem 7: FastAPI backend

### Prompt

> mow we do  problem 7 for that we need to build the FastAPI backend in backend/main.py so the React dashboard can communicate with our agent team.first, check the existing project and reuse the agents, database setup, and MCP tools we already created. please add the routes needed for the following:
>
> * Get all three tickets (101, 102, and 103) and show whether each one is open or resolved.
> * Run the agent team on a specific ticket when I send its ticket ID.
> * Get recent agent events, including what each agent said and which tools it used, so the frontend can refresh and show what is happening.
> * Approve a payment or purchase after a human clicks approve. The agents should only prepare the proposed payment or purchase; the approval route must be the part that actually changes the cash balance.
> * Get the current checking account balance from the cash_accounts table.
> * Reset the working database to its original values so I can test the tickets again from a clean start.
>
> make sure the routes use the existing data/campus_customs_new.db working database and don't accidentally modify the original data/campus_customs.db. Follow the shop rules we already set up, especially requiring human approval for payments and checking that there is enough cash before any payment is made. don't let the agents bypass the approval route to change the balance directly.plllease add a short explanation of each route to output/harness.md, with one line per route showing the URL and what it does.  test the routes as much as possible and fix any issues you find. I also need to be able to start the backend from the backend/ folder using uvicorn main:app --reload --port 8000. Keep the existing work from previous problems, update AI_prompts.md with my Problem 7 prompt, and don't start building the frontend yet.

## Problem 8: React dashboard

### Prompt

> ookay great lets proceed, noow help me with Problem 8. i need to build the frontend dashboard in frontend/ using React, Vite, and TypeScript. first, look through the existing project and the FastAPI routes from Problem 7 so the dashboard works with the backend we already have.
> I want the dashboard to feel like a real Campus Customs operations desk, not just a basic homework page. be creative with the design and make it clean, polished, and easy to use.
> the dashboard should include these features:Show all three tickets (101, 102, and 103), including their current status.
>
> * lemme select a ticket and start the agent team working on it.
> * show what each agent is saying and doing while the ticket is being processed, including the tools they use.
> * mark the ticket as resolved when the agent run finishes.
> * display a short summary of what each agent did for the selected ticket.
> * let a human approve a proposed payment or purchase when approval is needed.
> * show the current checking balance and update it after an approved payment.
>
> connect the frontend to the backend at http://localhost:8000. configure CORS on the backend so the Vite frontend origin, usually http://localhost:5173, is allowed to call the API.
> please make sure the buttons and features actually work with the existing backend routes instead of just looking good. handle loading states and errors so it's clear when something is running or when a request fails. for the agent activity, use the recent events route and refresh the information while the ticket is running.
> I also need an output/design.md file explaining the design choices, including the layout, how each agent's activity is displayed, how resolved tickets and the cash balance are shown, and what makes the dashboard feel special and pleasant to use. after implementing everything, test the main features and fix any issues you find. make sure I can start the frontend from the frontend/ folder using npm run dev. Keep the earlier work intact and update AI_prompts.md with the prompt I used for prob 8. lets gooo

## Problem 9: Full run on all three tickets

### Prompt

> great let's proceed wih with Problem 9. I need to run the full Campus Customs system on all three tickets (101, 102, and 103) and document what actually happens. before starting, check the existing code and make sure everything from the previous problems is working. first, reset data/campus_customs_new.db to its original starting state so we have a clean run. Do not change data/campus_customs.db. record the starting checking balance from the working database before running any tickets. then use the React dashboard to run tickets 101, 102, and 103 until all three are resolved. please use the actual agent runs and tool outputs to record what happened, rather than making up results or marking tickets resolved manually. Follow the human approval rules for any payments or purchases, and check the cash balance after each ticket is resolved.
> after the runs, update output/desk_tickets.html from Problem 6. Keep the Expected sections as they are, and fill in the Actual section for each ticket with which agents worked on it, what they delegated to other agents, and which MCP tools they used. I want to be able to compare my original plan with what actually happened. on the Cash tab in output/desk_tickets.html, add a clear breakdown of the money:
>
> * Starting checking balance after the database reset.
> * For each ticket, how the cash balance changed when it was resolved, including the payment or purchase, its dollar amount, and why the money was spent.
> * Ending checking balance after all three tickets are finished.
>
> make sure the ending balance matches the actual cash_accounts table in data/campus_customs_new.db. Please double-check the calculations, because the cash math needs to be correct.
> also create output/resolved_tickets.json. For each ticket, include its ID, final status, a short description of the outcome, what each agent contributed, and any human approvals that happened.
> create output/resolved_board.html as a standalone HTML page I can open by double-clicking it. It should show screenshots of the React dashboard for each resolved ticket (101, 102, and 103), so capture the actual board after each ticket has been resolved rather than using mock screenshots.
> make sure real agent runs are appended to output/audit_trail.json. Do not erase the existing audit records.  finish updating output/harness.md so it covers the database tables, all MCP tools, the five agents, API routes, dashboard features, and safety rules. please test the results and check that the ticket statuses, audit trail, approvals, and cash balances all agree with each other. If something fails, investigate and fix it instead of inventing successful results. Update AI_prompts.md with my Problem 9 prompt

## Problem 10: Reflection

### Prompt

> okay lets proceed with 10 -- the reflection. open output/desk_tickets.html and fill in the Reflection tab based on the actual results from our Campus Customs app and the three tickets we ran (101, 102, and 103).
> I want the reflection to sound like my own thoughts as a student, not a generic AI essay. Be detailed and specific, and use evidence from the Expected and Actual sections of each ticket tab and the Cash tab. check the actual results and audit trail before writing anything. Don't invent details about what the agents did or how much money was spent. Please cover all of these questions:
>
> 1. Agent performance: How well did the agents handle each of the three tickets, and why? Discuss what worked well and what could have been better for each ticket.
> 2. Expected vs. Actual: For each ticket, compare what I originally expected the Boss and other agents to do with what actually happened. Mention the delegations, MCP tools, and any differences that mattered.
> 3. One agent vs. multiple agents: Which parts of this homework could have been handled more simply by one agent with tools instead of a full multi-agent team? Explain why, using examples from our tickets.
> 4. Three problems the team could solve: Describe three realistic new problems Campus Customs might face that this agent team could handle with the MCP tools we already built. Explain how the existing agents and tools would help in each case.
> 5. Three problems the team could not solve yet: Describe three other realistic problems the shop might face that our current system cannot fully handle. For each one, explain what new MCP tools, database information, or agent capabilities we would need to add.
>
> okay make the answers thoughtful and thorough, and connect everything to the actual Campus Customs system rather than giving general explanations about AI agents. Use the ticket outcomes, agent contributions, tool calls, and cash changes as evidence wherever relevant. keep the existing ticket tabs and Cash tab intact. Only fill in the Reflection tab, using clear headings so each question is easy to follow. Make sure the reflection is saved in output/desk_tickets.html, and update AI_prompts.md with the prompt I used for Problem 10. Don't change the earlier Expected plans or the actual ticket results just to make the reflection sound better.

## Problem 11: Submit to GitHub

### Prompt

> okaaaay finally!!!!  help me with Problem 11. i need to push my completed homework to a public GitHub repository so the graders can clone it, and save the repository URL in output/github_url.txt.
> First, check the whole project and make sure the files from the previous problems are organized correctly. The final project should follow the required HW 5/ structure, including AI_prompts.md, requirements.txt, .env.example, .gitignore, .mcp.json, README.md, both database files under data/, the MCP server, backend, frontend, and all the required output files.
> Before pushing anything, check that:
>
> * Both data/campus_customs.db and data/campus_customs_new.db are included in the repository so the graders can run the app.
> * My real .env file, API keys, and other secrets are not committed. Keep .env.example with placeholders only, and make sure .gitignore excludes sensitive files and unnecessary folders.
> * The README explains how to copy the original database to the working copy for a clean run, start the MCP server, start the FastAPI backend, launch the React board, and reset the database before running all three tickets.
> * The required files from the earlier problems are present, including output/harness.md, output/mcp_smoke.json, output/desk_tickets.html, output/design.md, output/resolved_tickets.json, output/resolved_board.html, and output/audit_trail.json.
>
> please also check that the project can be set up using the documented instructions. don't delete or overwrite my previous work just to make the folder structure look right.
> If the project is ready, initialize Git if needed, commit the homework files, and push them to a public GitHub repository. If I need to authenticate or create a repository first, tell me what I need to do rather than pretending the push succeeded.
> After the push succeeds, save the exact repository URL in output/github_url.txt and verify that the file contains the correct URL. Don't put a made-up URL there. Also update AI_prompts.md with the prompt I used for Problem 11.
> Finally, tell me the repository URL so I can submit it to Canvas myself. Keep the work focused on submission and don't change the actual ticket results or cash calculations from the previous problems.
