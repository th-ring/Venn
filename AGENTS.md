# AGENTS.md

Richtlinien und Best Practices für Agenten in diesem Repository (`LivingAreaFinder`).

## 1. Projekt-Kontext
- **Tech-Stack**: React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet, Turf.js
- **Paketmanager**: `npm` (oder `bun`)
- **Wichtige Befehle**:
  - Build: `npm run build`
  - Type-Check / Lint: `npm run lint`
  - Dev-Server: `npm run dev`

---

## 2. Git & Commit Workflow

### Strikte Staging-Regel (Targeted Staging)
- **NIEMALS** `git add .`, `git add -A` oder `git commit -a` ausführen.
- Es dürfen **ausschließlich** die Dateien gestaged werden, die direkt zur aktuellen Aufgabe gehören (`git add <datei1> <datei2>`).
- Fremde oder unfertige Zwischenstände anderer Agenten/Aufgaben müssen unberührt im Working Tree bleiben.

### Quality Gate vor dem Commit
- Vor jedem Commit muss die Codebasis validiert werden:
  1. `npm run lint` (TypeScript-Check)
  2. `npm run build` (Vite-Build)
- Vor dem Staging immer `git status` prüfen (keine Secrets, `.env` oder temporäre Skripte stagen).

### Schlanke Commit-Nachrichten (Minimal & Prägnant)
- **Kein AI-Fluff**: Keine ausschweifenden Erklärungen oder Aufzählungen.
- **Titel-Format (1. Zeile)**: `<type>(<scope>): <kurze technische Beschreibung>`
- **Optionaler User-Impact (2. Zeile nach Leerzeile)**:
  - Bei Änderungen mit Auswirkung auf UI/UX oder Nutzerverhalten: genau **1 kurzer Satz** mit `Impact: <Effekt für den Nutzer>`.
  - Bei rein internen Aufgaben (Refactoring, Typen, Chores) bleibt der Commit ein reiner Einzeiler.
- **Typen**: `feat`, `fix`, `refactor`, `perf`, `docs`, `chore`
- **Beispiele**:
  - Reiner Einzeiler:
    `refactor(commute): extract person card state logic`
  - Mit User-Impact:
    ```
    feat(settings): relocate central settings to header button

    Impact: Schafft mehr Platz in der Sidebar; Einstellungen sind nun permanent über den Header erreichbar.
    ```

### Push-Verhalten
- Nach erfolgreichem Commit auf den Ziel-Branch pushen (`git push origin <branch>`).
- Tritt beim Push ein Fehler auf (z. B. Auth-Problem oder Remote-Konflikte), wird der Nutzer sofort informiert.

---

## 3. Multi-Agent & Subagent-Koordination
- **Subagents committen nicht eigenmächtig** im selben Branch, sondern melden ihre modifizierten Dateien an den Lead-Agenten zurück.
- Wenn Subagents parallel arbeiten, muss ein isolierter Workspace (`Workspace: 'branch'`) genutzt werden.
- Der Lead-Agent fungiert als Integrator: Er prüft das Gesamtergebnis, führt das Quality Gate aus und erstellt den schlanken Commit.
