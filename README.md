Open-Hub is a GitHub client focused on fast navigation, rich repo browsing, and keyboard-driven workflows.

Features

- Trending repositories discovery
- Profile pages with activity and repositories
- Repository explorer with file tree, previews, and edits
- Command palette with slash commands and quick actions
- Keyboard shortcuts for repo actions and tabs
- Context menus for links, inputs, and media

Tech stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS + shadcn/ui
- NextAuth (GitHub OAuth)
- cmdk, sonner, react-markdown

Getting started

1. Install dependencies: `bun install`
2. Create `.env` from `.env.example`
3. Start dev server: `bun dev`

Environment variables

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Scripts

- `bun dev` runs the dev server
- `bun run build` builds the app
- `bun run start` starts the production server
- `bun run lint` runs ESLint
- `bun run typecheck` runs TypeScript

Notes

- Add `http://localhost:3000/api/auth/github/callback` as the GitHub OAuth callback URL for local development.
