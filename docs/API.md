# Dietas — API Reference

## Mock API (json-server)

Base: `http://localhost:3001` (dev) / `http://127.0.0.1:3001` (Android + ADB reverse)

```bash
npx json-server docs/db.json --port 3001
```

---

## Endpoints

### GET /nurses — Login

Enfermeros registrados. Login valida cliente-side (usuario + password).

```json
[
  {
    "id": "1",
    "nombre": "Enfermera Andrea",
    "usuario": "andrea",
    "password": "1234",
    "estaciones": ["1", "2"]
  }
]
```

**Auth**: POST no disponible en mock — el login busca coincidencia en el array.

---

### GET /stations — Estaciones

```json
[
  { "id": "1", "nombre": "3er Piso" },
  { "id": "2", "nombre": "5to Piso" }
]
```

---

### GET /patients — Pacientes

Query params soportados por json-server: `?stationId=1`, `?q=search`

```json
[
  {
    "id": "4752495",
    "nombre": "Juan Perez",
    "stationId": "1",
    "habitacion": "301",
    "cama": "A",
    "dietaId": "1",
    "alergias": ["Maní"],
    "notas": "Paciente con movilidad reducida"
  }
]
```

---

### GET /dietas — Tipos de Dieta

```json
[
  {
    "id": "1",
    "nombre": "Hiposódica",
    "tiempos": ["desayuno", "almuerzo", "merienda", "cena"],
    "simbolo": "heart.fill"
  }
]
```

- `tiempos`: tiempos de comida disponibles para esa dieta
- `simbolo`: icono Lucide para mostrar en cards

---

### GET /comidas — Catálogo de Comidas

```json
[
  {
    "id": "101",
    "dietaId": "1",
    "nombre": "Pollo al horno",
    "tiempo": "almuerzo",
    "subcomidas": [
      {
        "id": "101a",
        "nombre": "Pechuga de pollo",
        "descripcion": "Pechuga a la plancha sin sal",
        "ingredientes": [
          { "id": "1", "nombre": "Pechuga de pollo" },
          { "id": "2", "nombre": "Aceite de oliva" }
        ]
      }
    ]
  }
]
```

Filtrar por dieta: `GET /comidas?dietaId=1`

---

### GET /pedidos — Historial

```json
[
  {
    "id": "1001",
    "items": [
      {
        "id": "item-1",
        "comidaId": "101",
        "comidaNombre": "Pollo al horno",
        "pacienteId": "4752495",
        "pacienteNombre": "Juan Perez",
        "flagHoy": true,
        "nota": ""
      }
    ],
    "pacienteId": "4752495",
    "timestamp": "2026-06-22T10:30:00.000Z",
    "status": "sent"
  }
]
```

- `status`: `'sent'` (enviado a cocina) o `'en_cocina'` (recibido por cocina)
- No hay filtro server-side por paciente — filtrar cliente-side

---

### POST /pedidos — Enviar a Cocina

```json
POST /pedidos
{
  "items": [ /* CartItem[] */ ],
  "pacienteId": "4752495",
  "timestamp": "2026-06-23T10:30:00.000Z",
  "status": "sent"
}
```

Response: el objeto creado (con `id` auto-generado por json-server).

---

## Plan de migración a API real

| Endpoint mock | API real planificada | Notas |
|--------------|---------------------|-------|
| GET /nurses | POST /auth/login | JWT + refresh token |
| GET /stations | GET /api/estaciones | Auth required |
| GET /patients | GET /api/pacientes | Filtro por estación server-side |
| GET /dietas | GET /api/dietas | Cacheable |
| GET /comidas | GET /api/comidas | Cacheable, filtro por dieta |
| GET /pedidos | GET /api/pedidos | Filtro por estación/fecha |
| POST /pedidos | POST /api/pedidos | Validación server-side |

## Status Flow

```
sent ──> en_cocina
  │         │
  │         └── cocina recibió y procesa
  │
  └── enfermero envió, pendiente de recepción
```

No hay endpoint para cambiar status aún (futuro: PATCH /pedidos/:id).
