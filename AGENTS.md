# AGENTS.md

Guidelines and best practices for agents in this repository (`Venn`).

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

## 3. Release Management & Versioning Standard

### 3.1 Proactive Agent-Driven Release Responsibility
Release decisions are actively guided and proposed by the agent, not left to chance:
- At the conclusion of any feature, bugfix, or milestone, the agent evaluates the changes since the last git release tag.
- If the threshold for a release is met (see below), the agent **must proactively propose a release** to the user.
- The proposal must include:
  1. The recommended SemVer bump type (`patch`, `minor`, `major`) and target version number (e.g. `v1.1.0`).
  2. Curated draft of the Release Notes (categorized for `CHANGELOG.md`).
  3. A prompt requesting the user's confirmation before cutting the release.

### 3.2 Semantic Versioning (SemVer) Policy
Versions strictly follow `MAJOR.MINOR.PATCH` (`vX.Y.Z`):
- **PATCH (`x.y.Z`)**:
  - *When*: Backward-compatible bug fixes (`fix`), minor UX edge-case patches, accessibility tweaks, or non-breaking performance optimizations (`perf`).
  - *Trigger*: Cut immediately for critical hotfixes, or propose after accumulating 2–4 smaller fixes/optimizations.
- **MINOR (`x.Y.0`)**:
  - *When*: Backward-compatible new user-facing features (`feat`), significant UI capabilities, or major workflow expansions.
  - *Trigger*: Propose immediately upon completing and verifying any substantial new feature or UX enhancement.
- **MAJOR (`X.0.0`)**:
  - *When*: Incompatible API changes, breaking state/storage schema migrations, or fundamental architectural replacements.
  - *Trigger*: Requires explicit alignment with the user prior to release execution.

### 3.3 Release Notes & Documentation Standard (`CHANGELOG.md`)
- A project-level `CHANGELOG.md` must be maintained following [Keep a Changelog](https://keepachangelog.com/) standards.
- **User-Facing Focus**: Changelog and release notes speak to the user, not the compiler.
  - The `Impact:` line in Conventional Commits is the primary source for release notes entries.
  - Omit internal churn (e.g. build tooling, internal typing fixes, routine dependency bumps) from user-facing notes unless impactful.
- **Standard Sections**:
  - `### Added` — New features and user-facing capabilities (`feat`).
  - `### Changed` — Updates to existing workflows, layout, or behaviors (`refactor`, `style`).
  - `### Fixed` — Bug fixes and error resolutions (`fix`).
  - `### Performance` — Measurable speed, memory, or rendering improvements (`perf`).

### 3.4 Release Execution Protocol
Once the user confirms the agent's release proposal, the agent executes the release sequentially:
1. **Prepare `CHANGELOG.md`**: Create the version header `## [X.Y.Z] - YYYY-MM-DD` and insert the curated release notes.
2. **Update `package.json`**: Update `"version": "X.Y.Z"`.
3. **Run Quality Gate**:
   - `npm run lint`
   - `npm run build`
4. **Targeted Staging & Release Commit**:
   - Stage only: `git add package.json CHANGELOG.md`
   - Commit message: `chore(release): cut release vX.Y.Z`
5. **Create Annotated Git Tag**:
   - `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
6. **Push Branch and Tags**:
   - `git push origin <branch> --tags`
7. **Publish Official GitHub Release**:
   - Publish the release to GitHub via the GitHub CLI (`gh`), including the curated release notes from `CHANGELOG.md`:
     `gh release create vX.Y.Z --title "vX.Y.Z" -F <notes-file> --verify-tag [--latest]`
   - Verify the published release appears on GitHub (`gh release list`).

---

## 4. Multi-Agent & Subagent Coordination
- **Subagents do not commit autonomously** to the same branch; instead they report their modified files back to the lead agent.
- When subagents work in parallel, an isolated workspace (`Workspace: 'branch'`) must be used.
- The lead agent acts as integrator: it reviews the combined result, runs the quality gate, and creates the lean commit.

---

## 5. Design References & Brand Neutrality Standard

### Conceptual Design Intent (Design Over Brand)
- When benchmark brand names (e.g. Apple, Airbnb, Google) are mentioned in prompts or requirements, they serve strictly as shorthand for **underlying UX and design principles**, never for the brands themselves:
  - Radical simplicity, uncluttered layouts, and reduced cognitive load.
  - Progressive disclosure (essential controls visible immediately; deeper options revealed contextually).
  - Compact floating capsules, icon-first affordances, and touch-ergonomic targets.
  - Calm visual surfaces, subtle borders, and clean typography.

### Strict Brand Neutrality in Files, Commits & Releases
- **NEVER** include benchmark brand names in:
  - Source code, comments, CSS class names, or JSX labels (use generic terms like "floating capsule", "segmented icon control", "dock bar").
  - Commit titles or impact descriptions.
  - `CHANGELOG.md`, GitHub release notes, or public documentation/showcases.
- **Technical Exception**: Legitimate functional integrations (e.g. Google Maps JavaScript API loader/types) and web platform standards (e.g. `-apple-system`, `apple-mobile-web-app-capable`) remain permitted where technically required.
