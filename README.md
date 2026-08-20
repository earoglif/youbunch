# YouBunch

YouBunch is a Chrome extension for organizing YouTube subscriptions into custom groups directly inside the YouTube interface.

Repository: [github.com/earoglif/youbunch](https://github.com/earoglif/youbunch)

## Features

- Adds a grouped subscriptions section to the YouTube guide/sidebar.
- Provides a React-based group manager modal for creating, editing, deleting, collapsing, and reordering groups.
- Supports assigning channels to groups with drag-and-drop.
- Shows ungrouped subscriptions separately.
- Sorts subscriptions by YouTube relevance, A-Z, or Z-A.
- Detects newly published channel content and marks channels as seen when opened.
- Opens an assignment dialog after subscribing to a channel.
- Removes unsubscribed channels from local subscription/group state.
- Imports and exports group backups as JSON.
- Generates an AI chat prompt for reorganizing subscriptions into groups.
- Stores data per YouTube user when a user id is available, with an anonymous fallback.
- Supports English and Russian UI strings.

## Tech Stack

- TypeScript
- React 19
- Vite 6
- `@crxjs/vite-plugin`
- Chrome Extensions Manifest V3
- Tailwind CSS 4
- shadcn/Radix UI components
- `@dnd-kit` for drag-and-drop
- `webextension-polyfill`
- YouTube Data API v3 via Chrome `identity`

## Requirements

- Node.js 18+
- npm
- Google OAuth client id configured for a Chrome extension
- YouTube Data API v3 enabled for the Google Cloud project

## Environment

Create a `.env` file in the project root:

```bash
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

The build fails without `VITE_GOOGLE_CLIENT_ID` because `vite.config.ts` injects it into the MV3 manifest OAuth configuration.

## Installation

```bash
npm install
```

## Development

Build the extension in watch mode:

```bash
npm run dev
```

Then load the generated extension in Chrome:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the generated `dist` folder.

For CRX/Vite HMR development, run:

```bash
npm run dev:hmr
```

## Production Build

```bash
npm run build
```

The packaged extension output is generated in `dist`.

## Scripts

- `npm run dev` - runs `vite build --watch`.
- `npm run dev:hmr` - starts the Vite dev server for extension HMR.
- `npm run build` - creates a production extension build.
- `npm run preview` - starts Vite preview.

## Project Structure

```text
├── public/
│   └── _locales/              # Chrome extension name/description locales
├── src/
│   ├── background/            # MV3 service worker and YouTube API handlers
│   ├── components/ui/         # Shared UI primitives
│   ├── content/               # YouTube content scripts and injected React UI
│   │   ├── components/        # Group manager, guide, dialogs, lists
│   │   ├── hooks/             # React hooks for groups, subscriptions, newness
│   │   ├── modal/             # Modal-specific drag-and-drop logic
│   │   └── services/          # YouTube page bridge and content-side services
│   ├── shared/                # Shared storage, messaging, i18n, types, services
│   ├── styles/                # Global Tailwind/shadcn styles
│   └── lib/                   # Small shared utilities
├── manifest.config.ts         # Chrome extension manifest factory
├── vite.config.ts             # Vite, React, Tailwind, CRX, and alias config
├── tsconfig.json              # TypeScript configuration
└── components.json            # shadcn component configuration
```

## Architecture

The extension runs two content scripts on `https://www.youtube.com/*`:

- `src/content/index.ts` initializes the extension UI, including the guide groups section and subscribe assignment dialog.
- `src/content/page-script.ts` runs in the page's main world and bridges YouTube page state/events back to the isolated content script.

The background service worker in `src/background/index.ts` registers message handlers for subscription loading, channel details, new-content checks, and seen-state updates. Content-side services call these handlers through the shared typed messaging layer in `src/shared/messaging`.

Group data, collapsed state, sort preferences, user id, and new-content cache data are stored in `chrome.storage.local` through `webextension-polyfill`.

## Localization

The project uses two localization layers:

- Chrome extension metadata is stored in `public/_locales/en` and `public/_locales/ru`.
- In-page React UI strings are stored in `src/shared/locales/en.json` and `src/shared/locales/ru.json`.
