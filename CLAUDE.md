# PXEForge

Appliance Dockerizado para boot PXE con iVentoy.

## Estructura

```
pxeforge/
├── docker-compose.yml     # Orquestación completa
├── .env                   # Config sensible
├── nginx.conf             # Reverse proxy
├── data/ -> /mnt/Storage/pxeforge-data  # ISOs + datos persistentes
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI entry
│   │   ├── config.py     # Constantes
│   │   ├── database.py   # SQLAlchemy + SQLite
│   │   ├── models.py     # ORM models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── auth.py       # JWT auth
│   │   ├── routers/
│   │   │   ├── auth_router.py  # Login
│   │   │   ├── dashboard.py    # Dashboard + logs
│   │   │   ├── isos.py         # CRUD + download
│   │   │   ├── clients.py      # PXE clients
│   │   │   └── backups.py      # Backup management
│   │   └── services/
│   │       ├── iventoy.py      # iVentoy API client
│   │       ├── iso_service.py  # ISO utils
│   │       ├── backup_service.py  # ZIP generation
│   │       └── download_service.py # aria2 integration
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── api.js       # API client
│   │   └── App.jsx      # Router
│   ├── Dockerfile
│   └── default.conf     # SPA nginx config
└── samba/
    └── smb.conf
```

## Servicios

| Servicio  | Puerto | Descripción                 |
|-----------|--------|-----------------------------|
| iventoy   | host   | ProxyDHCP + PXE + ISO repo |
| backend   | 8000   | FastAPI REST                |
| frontend  | 80     | React SPA                   |
| aria2     | 6800   | Descargas HTTP + Torrent    |
| samba     | 139/445| Compartición SMB            |
| nginx     | 80     | Reverse proxy               |

## Comandos

```bash
docker compose up -d
docker compose logs -f
docker compose down
```

## Credenciales default

- Admin: `admin` / `admin123`
- Samba: `pxe` / `pxe123`

## Endpoints API

- `POST /api/auth/login` - Login
- `GET /api/dashboard` - Dashboard data
- `GET /api/logs` - Audit logs
- `GET /api/isos` - List ISOs
- `DELETE /api/isos/:id` - Delete ISO
- `POST /api/isos/upload` - Upload ISO (multipart)
- `POST /api/isos/download?url=` - Download from URL
- `POST /api/isos/download-torrent?magnet=` - Torrent
- `POST /api/isos/download-preloaded?name=` - Quick add
- `GET /api/isos/:id/download` - Download ISO file
- `GET /api/isos/preloaded` - Preloaded distros
- `GET /api/clients` - PXE clients
- `GET /api/backups` - List backups
- `POST /api/backups` - Create backup
