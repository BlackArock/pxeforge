# PXEForge

Appliance Dockerizado para boot PXE con iVentoy + FastAPI + React.

## Stack

- **iVentoy** — ProxyDHCP + servidor PXE (bootea ISOs sin configuración manual)
- **FastAPI** — REST API con SQLAlchemy + SQLite
- **React SPA** — Frontend con React Router + Vite
- **aria2** — Descargas HTTP/BitTorrent con RPC
- **Samba** — Compartición SMB de ISOs (puertos 1399/4459)
- **nginx** — Reverse proxy unificando backend y frontend

## Arquitectura

```
nginx :8099
├── /api/* → backend:8000
└── /*    → frontend:80

backend → host.docker.internal:26000 (iVentoy API)
backend → aria2:6800/jsonrpc (RPC secret)
```

## Datos persistentes

```
data/ → /mnt/Storage/pxeforge-data (symlink)
├── isos/           # Archivos ISO + _disabled/
├── configs/        # iVentoy config + aria2 config
├── logs/iventoy/   # Logs de iVentoy
├── backups/        # Backups ZIP de configuración
└── pxeforge.db     # SQLite database
```

## Servicios

| Servicio  | Puerto host | Puerto interno | Descripción               |
|-----------|-------------|----------------|---------------------------|
| iventoy   | host net    | 26000 (API)    | ProxyDHCP + PXE + ISO     |
| backend   | —           | 8000           | FastAPI REST              |
| frontend  | —           | 80             | React SPA (Vite + nginx)  |
| aria2     | 6800        | 6800 (RPC)     | Descargas + Torrent       |
| samba     | 1399/4459   | 139/445        | SMB share (pxe/pxe123)    |
| nginx     | 8099        | 80             | Reverse proxy             |

## Route ordering (CRITICAL — FastAPI)

Las rutas concretas deben ir ANTES de las parametrizadas:

```
GET /isos/preloaded      ✓ concreto
GET /isos/downloads      ✓ concreto
DELETE /isos/downloads   ✓ concreto
DELETE /isos/{iso_id}    ✗ parametrizado — va al final
```

Si `/{iso_id}` está antes, captura `/downloads` como un ID de string.

## iVentoy integration

- **API**: `host.docker.internal:26000` (no expuesta al host directamente)
- **Sin REST API documentada** — solo endpoints `/api/status`, `/api/iso/list`, `/api/iso/add`, `/api/iso/remove`, `/api/client/list`
- **ISO management es filesystem**: mover ISO a `_disabled/` la oculta del menú PXE
- **AUTO_START_PXE=false** porque `config.dat` tiene DHCP IP en 0.0.0.0 hasta configurar web UI manual
- **Port 26000 accesible en host** cuando iVentoy corre en modo manual

## ISO hiding (filesystem-based)

Since iVentoy has no documented REST API to toggle ISO visibility, we use the filesystem:

- `_disabled/` subdirectory inside `isos/`
- `PUT /isos/{id}/toggle` → mueve el `.iso` entre `isos/` y `isos/_disabled/`
- iVentoy solo ve lo que está en `iso/` — `_disabled/` queda invisible al menú PXE
- `_reconcile_isos()` escanea ambos directorios y registra lo nuevo en BD

## aria2 download flow

1. Frontend POST a `/isos/download?url=` → crea `Download` en BD → llama `aria2.addUri` via JSON-RPC
2. Frontend poll cada 2s a `/isos/downloads` → `enrich_download()` consulta `aria2.tellStatus`
3. Cuando aria2 reporta `complete`, `enrich_download()` llama `_register_iso()` que crea `ISOImage` + notifica iVentoy
4. aria2 **dedup**: si descarga `win.iso` y ya existe, crea `win.1.iso` — `_register_iso()` busca variantes con `sorted(p for p in ISOS_DIR.iterdir() if ...)`

## Database (SQLite, sin migrations automáticas)

- `iso_images` — ISO registrados con `display_order` (Integer) y `enabled` (Integer 0/1)
- `boot_clients` — clientes PXE detectados, únicos por MAC
- `downloads` — descargas aria2 con `aria2_gid`
- `audit_logs` — registro de acciones
- `backups` — backups ZIP generados

Si se agregan columnas nuevas, hay que eliminar la DB o agregar ALTER TABLE manual.

## Credenciales (todo en .env)

- Admin: `admin` / `admin123`
- Samba: `pxe` / `pxe123`
- aria2 RPC secret: `pxeforge`
- JWT secret: `pxeforge-secret-change-in-production`

⚠️ Cambiar en producción.

## Samba share format

`dperson/samba` requiere: `SHARE=name;path;browse;readonly;guest;users`

```
SHARE=ISOS;/mount;yes;no;no;pxe
         name   path  browse ro   guest user
```

El 5to campo es **boolean** (`no`). Si falta, Samba falla con `value is not boolean!`.

## iVentoy config.dat (critical)

iVentoy guarda DHCP config en `data/configs/config.dat`. Si `AUTO_START_PXE=true` pero DHCP IP es `0.0.0.0`, el proceso se cierra inmediatamente. Solución:

1. Dejar `AUTO_START_PXE=false`
2. Abrir `http://192.168.242.248:26000` en browser
3. Configurar DHCP con IP del servidor
4. Cambiar a `AUTO_START_PXE=true`
5. `docker compose up -d`

## Disk

- Path: `/mnt/Storage/pxeforge-data/isos/`
- ~3.7 TB total, ~78 GB usado (2.1%)
- Si el disco se llena, el dashboard lo muestra con barra roja (>90%)

## Endpoints API

### Auth
- `POST /api/auth/login` — Login, devuelve JWT

### Dashboard
- `GET /api/dashboard` — Status, stats, logs (últimos 20)
- `GET /api/logs` — Audit logs (últimos 100)
- `DELETE /api/logs` — Clear all audit logs

### ISOs
- `GET /api/isos` — Listar + reconciliar
- `GET /api/isos/preloaded` — Preloaded distros
- `GET /api/isos/downloads` — Descargas en curso/completadas
- `DELETE /api/isos/downloads` — Limpiar descargas completadas/error
- `DELETE /api/isos/downloads/{id}` — Eliminar una descarga
- `DELETE /api/isos/{iso_id}` — Eliminar ISO (file + DB + iVentoy)
- `POST /api/isos/upload` — Subir ISO (multipart)
- `POST /api/isos/download?url=` — Descargar desde URL
- `POST /api/isos/download-torrent?magnet=` — Torrent
- `POST /api/isos/download-preloaded?name=` — Quick add
- `GET /api/isos/{iso_id}/download` — Descargar ISO file
- `PUT /api/isos/{iso_id}/toggle` — Habilitar/deshabilitar
- `PUT /api/isos/reorder` — Batch update display_order

### Clients
- `GET /api/clients` — Listar + sync con iVentoy

### Backups
- `GET /api/backups` — Listar
- `POST /api/backups` — Crear backup ZIP
- `DELETE /api/backups/{id}` — Eliminar

## Commands

```bash
# Start
docker compose up -d

# Logs
docker compose logs -f
docker compose logs -f backend

# Restart single service
docker compose restart backend
docker compose restart iventoy

# Stop
docker compose down

# Rebuild (after code changes)
docker compose up -d --build backend
docker compose up -d --build frontend
```

## Gotchas & reglas

1. **FastAPI route ordering** — concretas antes de parametrizadas
2. **Samba SHARE format** — 6 campos, 5to es boolean
3. **iVentoy no tiene REST API completa** — ISO hiding es filesystem, no API
4. **aria2 dedup** — `.1.iso`, `.2.iso` variants al descargar duplicados
5. **No hay migrations** — SQLite schema debe mantenerse a mano (ALTER TABLE o delete DB)
6. **AUTO_START_PXE=false** — necesario hasta configurar DHCP manualmente
7. **`_disabled/`** se crea automáticamente al toggle el primer ISO
8. **Symlink `data/`** apunta a `/mnt/Storage/pxeforge-data` — no mover sin actualizar
9. **JWT sin refresh token** — expira en 24h, hay que reloguear
10. **nginx `client_max_body_size 0`** — permite uploads de ISOs grandes sin límite
