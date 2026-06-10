from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import auth_router, backups, clients, dashboard, isos

app = FastAPI(title="PXEForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(dashboard.router)
app.include_router(isos.router)
app.include_router(clients.router)
app.include_router(backups.router)


@app.on_event("startup")
def on_startup():
    init_db()
