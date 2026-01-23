# Compound Engineering Plugin - Quick Start Guide

## What Is This?

You now have the **Compound Engineering Plugin** installed in your repository! This is a comprehensive set of AI-powered tools developed by Every Inc that implements a development methodology where **each unit of engineering work makes subsequent work easier**.

## Philosophy

Traditional development accumulates technical debt. Compound engineering inverts this:
- **80% effort** on planning and review
- **20% effort** on execution
- Code quality stays high
- Future changes become easier over time

## What Was Installed

Your `.claude-plugin/` directory now contains:

```
.claude-plugin/
├── agents/          # 27 specialized AI agents
│   ├── review/      # 14 code review agents
│   ├── research/    # 4 research agents
│   ├── design/      # 3 design agents
│   ├── workflow/    # 5 workflow agents
│   └── docs/        # 1 documentation agent
├── commands/        # 20 slash commands
│   └── workflows/   # Core workflow commands
├── skills/          # 14 specialized skills
└── README.md        # Full documentation
```

## Core Workflow

The compound engineering workflow follows this cycle:

```
Plan → Work → Review → Compound → Repeat
```

### Main Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/workflows:brainstorm` | Explore requirements and approaches | Before you start planning |
| `/workflows:plan` | Create detailed implementation plans | Turn ideas into actionable plans |
| `/workflows:work` | Execute plans with task tracking | Implement your planned changes |
| `/workflows:review` | Multi-agent code review | Before merging changes |
| `/workflows:compound` | Document learnings | After completing work |

## Quick Start

### 1. Start with an Idea

```
You: "I want to add user notifications to my app"
```

### 2. Brainstorm First

```
You: /workflows:brainstorm
```

This explores different approaches before you commit to an implementation.

### 3. Create a Plan

```
You: /workflows:plan
```

This creates a detailed implementation plan with all the steps needed.

### 4. Execute the Work

```
You: /workflows:work
```

This systematically executes the plan with proper task tracking.

### 5. Review Your Changes

```
You: /workflows:review
```

This runs multiple specialized agents to review your code for:
- Security issues
- Performance problems
- Code quality
- Best practices
- Framework-specific conventions

### 6. Compound Your Learning

```
You: /workflows:compound
```

This documents what you learned so future work is easier.

## Specialized Agents

You can also invoke individual agents for specific tasks:

### Code Review Agents

```bash
# Rails-specific review
claude agent kieran-rails-reviewer "review my user model"

# TypeScript review
claude agent kieran-typescript-reviewer "review my API client"

# Security audit
claude agent security-sentinel "audit my authentication code"

# Performance analysis
claude agent performance-oracle "analyze my database queries"
```

### Research Agents

```bash
# Research best practices
claude agent best-practices-researcher "best practices for caching in Rails"

# Research framework docs
claude agent framework-docs-researcher "Next.js 14 server actions"

# Analyze git history
claude agent git-history-analyzer "how has our auth system evolved?"
```

### Design Agents

```bash
# Compare implementation to Figma
claude agent design-implementation-reviewer "compare login page to Figma"

# Iterate on UI design
claude agent design-iterator "improve the dashboard layout"
```

## Useful Utility Commands

```bash
# Resolve todos in parallel
/resolve_todo_parallel

# Resolve PR comments in parallel
/resolve_pr_parallel

# Generate new slash commands
/generate_command

# Report bugs in the plugin
/report-bug

# Test browser functionality
/test-browser
```

## Skills

Skills are reusable knowledge modules. Some highlights:

- **`dhh-rails-style`** - Write Rails code like DHH
- **`git-worktree`** - Manage parallel development branches
- **`compound-docs`** - Document solved problems
- **`agent-browser`** - Browser automation
- **`gemini-imagegen`** - Generate images with AI

## MCP Server (Context7)

The plugin includes Context7 MCP server for framework documentation lookup.

**Note:** You may need to manually enable it in `.claude/settings.json`:

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

## Examples

### Example 1: Adding a New Feature

```
You: I want to add email notifications when users get new messages

Claude: /workflows:brainstorm
[explores different approaches: push notifications, email, in-app, etc.]

You: Let's go with email using SendGrid

Claude: /workflows:plan
[creates detailed plan: setup SendGrid, create mailer, add background job, tests]

Claude: /workflows:work
[implements each step systematically]

Claude: /workflows:review
[runs security-sentinel, performance-oracle, kieran-rails-reviewer]

You: Looks good!

Claude: /workflows:compound
[documents: "Email notification pattern using SendGrid + Sidekiq"]
```

### Example 2: Fixing a Bug

```
You: Users are reporting slow page loads on the dashboard

Claude: agent performance-oracle "analyze the dashboard controller"
[identifies N+1 queries and missing indexes]

Claude: [fixes the issues]

Claude: agent kieran-rails-reviewer "review my performance fixes"
[validates the solution follows best practices]

You: /workflows:compound
[documents: "Dashboard performance - eager loading and indexing strategy"]
```

## Benefits

1. **Faster Development** - Agents handle planning, research, and review in parallel
2. **Higher Quality** - Multiple specialized reviewers catch issues before merge
3. **Knowledge Compounds** - Each problem solved makes future similar problems easier
4. **Reduced Technical Debt** - Focus on planning and review prevents debt accumulation
5. **Consistent Patterns** - Skills and documented patterns ensure consistency

## Learn More

- Read the full plugin documentation: `.claude-plugin/README.md`
- Check the changelog: `.claude-plugin/CHANGELOG.md`
- Every's blog post: [Compound Engineering: How Every Codes with Agents](https://every.to/chain-of-thought/compound-engineering-how-every-codes-with-agents)

## Repository Stats

- **27 Agents** - Specialized reviewers, researchers, and workflow helpers
- **20 Commands** - Including the core workflow commands
- **14 Skills** - Reusable knowledge modules
- **1 MCP Server** - Context7 for framework documentation

## Tips

1. **Start Small** - Try `/workflows:plan` on a simple feature first
2. **Use Brainstorm** - Don't skip brainstorming; it often reveals better approaches
3. **Review Everything** - Run `/workflows:review` before every merge
4. **Document Learnings** - Use `/workflows:compound` to build team knowledge
5. **Parallel Reviews** - The review agents run in parallel for speed

## Next Steps

1. Try the workflow on your Next.js app:
   ```
   /workflows:plan
   ```

2. Explore the agents:
   ```
   ls .claude-plugin/agents/review/
   ```

3. Check out the skills:
   ```
   ls .claude-plugin/skills/
   ```

4. Read the full documentation:
   ```
   cat .claude-plugin/README.md
   ```

Happy compounding! 🚀
