# docker-notifier

App TypeScript standalone que escucha el Docker socket y notifica a Discord/Telegram cuando Watchtower actualiza un contenedor.

## Stack

- TypeScript estricto, ESM
- Node.js 24
- Dependencias: `dockerode`, `@types/dockerode`
- Sin frameworks

## Arquitectura — Clean Architecture

src/
├── domain/
│ ├── entities/
│ │ └── ContainerUpdate.ts # entidad: nombre, imagen, digestAnterior, digestNuevo, timestamp
│ └── ports/
│ ├── ContainerWatcher.ts # interface: watchEvents(), getRunningContainers()
│ └── Notifier.ts # interface: notify(update: ContainerUpdate): Promise<void>
├── application/
│ └── use-cases/
│ └── HandleContainerUpdate.ts # orquesta: compara digest, llama notifiers
├── infrastructure/
│ ├── docker/
│ │ └── DockerodeWatcher.ts # implementa ContainerWatcher con dockerode
│ └── notifiers/
│ ├── DiscordNotifier.ts # implementa Notifier vía webhook
│ └── TelegramNotifier.ts # implementa Notifier vía bot API
└── main.ts # composición root, wiring de dependencias

## Comportamiento

1. Al arrancar: snapshot de digests de todos los contenedores corriendo → Map<name, sha256>
2. Suscribirse a Docker Events API (type=container, event=start)
3. Por cada evento: comparar digest nuevo vs guardado → si difieren → HandleContainerUpdate → notificar → actualizar Map
4. Contenedor nuevo en Map → solo registrar, no notificar
5. Stream cerrada → reconectar automáticamente

## Env vars

DISCORD_WEBHOOK # omitir destino si no está definida
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
LOG_LEVEL=info

## Reglas

- Si falla un notifier → log warn, no crashear, continuar
- Si Docker socket no disponible al arrancar → exit 1
- Inyección de dependencias en main.ts, no en las clases
- Dockerfile multistage node:24-alpine, usuario no-root
- .env.example con todas las vars comentadas
