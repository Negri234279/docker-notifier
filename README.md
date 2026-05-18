# docker-notifier

Listens to the Docker socket and sends a notification to Discord and/or Telegram whenever Watchtower updates a container.

## How it works

1. On startup, takes a snapshot of all running containers and their image digests.
2. Subscribes to Docker Events API filtering `container:start`.
3. On each event, compares the new image digest against the snapshot:
   - **Digest changed** → sends notification and updates the snapshot.
   - **New container** → registers it silently, no notification.
   - **Same digest** → restart without image change, ignored.
4. If the event stream closes, reconnects automatically.

## Requirements

- Docker with socket access (`/var/run/docker.sock`)
- At least one notifier configured (Discord or Telegram)

## Configuration

Copy `.env.example` to `.env` and fill in your values:

```env
LOG_LEVEL=info

DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN

TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=-1001234567890
```

| Variable | Required | Description |
|---|---|---|
| `LOG_LEVEL` | No | `error` \| `warn` \| `info` \| `debug`. Default: `info` |
| `DISCORD_WEBHOOK` | No* | Discord webhook URL |
| `TELEGRAM_BOT_TOKEN` | No* | Telegram bot token |
| `TELEGRAM_CHAT_ID` | No* | Telegram chat or channel ID |

\* At least one notifier must be configured.

## Production

Uses the pre-built image from Docker Hub.

```bash
cp .env.example .env
# edit .env with your values
docker compose up -d
```

## Staging / local build

Builds the image locally.

```bash
cp .env.example .env.staging
# edit .env.staging with your values
docker compose -f docker-compose.staging.yml up -d --build
```

## Local development

```bash
cp .env.example .env
npm install
npm run build
node dist/main.js
```

## Project structure

```
src/
├── config/                         # env vars (infrastructure)
├── domain/
│   ├── entities/ContainerUpdate.ts # update data shape
│   └── ports/
│       ├── ContainerWatcher.ts     # watcher interface
│       └── Notifier.ts             # notifier interface
├── application/
│   └── use-cases/
│       └── HandleContainerUpdate.ts
├── infrastructure/
│   ├── config/env.ts               # dotenv loader + typed exports
│   ├── docker/DockerodeWatcher.ts  # dockerode implementation
│   ├── logger.ts
│   └── notifiers/
│       ├── DiscordNotifier.ts
│       └── TelegramNotifier.ts
└── main.ts                         # composition root
```
