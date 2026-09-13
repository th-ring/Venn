# AGENTS.md

Guidelines and best practices for agents in this repository (`LivingAreaFinder`).

## 1. Project Context
- **Tech stack**: React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet, Turf.js
- **Package manager**: `npm` (or `bun`)
- **Key commands**:
  - Build: `npm run build`
  - Type-check / Lint: `npm run lint`
  - Dev server: `npm run dev`

---

## 2. Git & Commit Workflow

### Strict Staging Rule (Targeted Staging)
- **NEVER** run `git add .`, `git add -A`, or `git commit -a`.
- Only stage the files that are **directly related** to the current task (`git add <file1> <file2>`).
- Unrelated or unfinished work from other agents/tasks must remain untouched in the working tree.

### Quality Gate Before Committing
- Before every commit, validate the codebase:
  1. `npm run lint` (TypeScript check)
  2. `npm run build` (Vite build)
- Always run `git status` before staging — do not stage secrets, `.env` files, or temporary scripts.

### Lean Commit Messages (Minimal & Concise)
- **No AI fluff**: No verbose explanations or bullet-point lists.
- **Title format (line 1)**: `<type>(<scope>): <short technical description>`
- **Optional user impact (line 3, after a blank line)**:
  - For changes that affect the UI/UX or user behaviour: exactly **1 short sentence** using `Impact: <effect for the user>`.
  - For purely internal work (refactoring, types, chores): keep the commit to a single line.
- **Types**: `feat`, `fix`, `refactor`, `perf`, `docs`, `chore`
- **Examples**:
  - Single-line:
    `refactor(commute): extract person card state logic`
  - With user impact:
    ```
    feat(settings): relocate central settings to header button

    Impact: Frees up sidebar space; settings are now permanently accessible via the header.
    ```

### Push Behaviour
- After a successful commit, push to the target branch (`git push origin <branch>`).
- If the push fails (e.g. auth issue or remote conflict), notify the user immediately.

---

## 3. Multi-Agent & Subagent Coordination
- **Subagents do not commit autonomously** to the same branch; instead they report their modified files back to the lead agent.
- When subagents work in parallel, an isolated workspace (`Workspace: 'branch'`) must be used.
- The lead agent acts as integrator: it reviews the combined result, runs the quality gate, and creates the lean commit.
