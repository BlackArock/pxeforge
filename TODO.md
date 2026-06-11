# TODO

## Features propuestas

### Core
- [ ] **Auto-promover descargas** — Background task que monitorea aria2 y crea `ISOImage` automáticamente (hoy lo hace el frontend vía polling)
- [ ] **Estadísticas de descarga** — Velocidad promedio, tiempo restante real, historial de descargas completadas
- [ ] **Refresh token** — JWT con refresh token para sesiones más largas sin reloguear
- [ ] **Paginación de ISOs** — Para catálogos grandes (+100 ISOs)
- [ ] **Búsqueda/filtro de ISOs** — Por nombre, tamaño, estado

### iVentoy
- [ ] **Configurar DHCP automáticamente** — API call a iVentoy para setear IP de DHCP al deploy (si la API lo soporta)
- [ ] **Grupos de boot** — Perfiles de ISOs para diferentes equipos/departamentos
- [ ] **Programación de boot** — Schedule para que ciertas ISOs se booteen en cierto horario (cloning overnight)
- [ ] **Estadísticas de boot** — Cantidad de boots por ISO, éxito/fallo

### Frontend
- [ ] **Tema oscuro** — Alternar entre light/dark mode
- [ ] **Notificaciones en tiempo real** — WebSocket para descargas, nuevos clientes, etc.
- [ ] **Multi-lenguaje** — Español/Inglés con i18n
- [ ] **Responsive design** — Sidebar colapsable, tablas responsive para mobile
- [ ] **Vista de tarjetas** — Alternativa a tabla para ISOs con preview
- [ ] **Drag & drop reordering** — En lugar de botones ▲/▼ en Boot Menu

### Gestión de ISOs
- [ ] **Editar metadatos** — Cambiar nombre, versión, OS name desde la UI
- [ ] **Multi-upload** — Subir varios ISOs a la vez
- [ ] **Verificación checksum** — Validar SHA256 después de descarga
- [ ] **Conversión de formatos** — Apoyo para `.img`, `.vhd`, etc.
- [ ] **Categorías/tags** — Etiquetar ISOs por tipo (Linux, Windows, Tools)

### Red y Clientes
- [ ] **Wake-on-LAN** — Botón para encender máquinas registradas
- [ ] **Historial de clientes** — Cuándo bootearon cada máquina, qué ISO usaron
- [ ] **Asignación de ISO por MAC** — Forzar que cierto equipo bootee una ISO específica
- [ ] **DHCP leases** — Ver leases activos desde el dashboard

### Sistema
- [ ] **Autenticación LDAP/OAuth** — Integración con directorio activo
- [ ] **Multi-usuario** — Roles (admin/operator/viewer)
- [ ] **Logs centralizados** — Exportar a syslog, Loki, o archivos rotativos
- [ ] **Healthchecks** — Endpoint `/health` + monitoreo de servicios
- [ ] **Backups automáticos** — Schedule para backup diario de BD + config
- [ ] **Versión de API** — Namespace `/api/v1/`

### Infraestructura
- [ ] **CI/CD** — GitHub Actions para construir imágenes y pushear a registry
- [ ] **Tests** — Backend (pytest), Frontend (vitest), integración
- [ ] **Documentación de API** — Swagger/OpenAPI exportable
- [ ] **Helm chart** — Para deploy en Kubernetes
- [ ] **Gestión de certificados** — TLS automático con Let's Encrypt
- [ ] **Separación de entornos** — dev/staging/prod compose overrides

## Bugs conocidos

- [ ] **iVentoy no levanta con `AUTO_START_PXE=true` sin DHCP configurado** — Workaround: iniciar en modo manual, configurar DHCP, reiniciar
- [ ] **aria2 dedup crea `.1.iso`** — El registro en BD busca la variante, pero el nombre original se pierde
- [ ] **No hay migraciones de DB** — Agregar columnas requiere ALTER TABLE manual o delete DB

## Técnica

- [ ] Migrar DB migrations a Alembic
- [ ] Type hints completos en backend (mypy strict)
- [ ] ESLint + Prettier config en frontend
- [ ] Docker multi-stage builds optimizados
- [ ] Healthcheck endpoints para cada servicio en compose
- [ ] Logs estructurados (JSON) en backend
