# API

## Mock (json-server)

```bash
npx json-server --watch docs/db.json --port 3001
```

## Endpoints

### POST /auth (simulado via GET /nurses)

**Request:**
```json
GET /nurses?usuario=andrea&password=1234
```

**Response (200):**
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

**Response (401):** `[]` (empty array)

### GET /stations

**Response:**
```json
[
  { "id": "1", "nombre": "3er Piso" },
  { "id": "2", "nombre": "5to Piso" },
  { "id": "3", "nombre": "UTI" }
]
```

### GET /patients?stationId={id}

**Response:**
```json
[
  {
    "id": "4752493",
    "nombre": "Juan Pérez López",
    "stationId": "1",
    "habitacion": "101",
    "cama": "A",
    "dietaId": "3",
    "alergias": ["frutos secos", "mariscos"],
    "notas": "Alergia severa."
  }
]
```

### GET /comidas?dietaId={id}&tiempo={D|A|M|C}

**Response:**
```json
[
  {
    "id": "1",
    "dietaId": "2",
    "nombre": "Arroz Aguado",
    "tiempo": "A",
    "subcomidas": [
      {
        "nombre": "Arroz con pollo",
        "descripcion": "Arroz cocido con pollo desmenuzado",
        "ingredientes": [
          { "nombre": "Arroz", "descripcion": "Arroz blanco" },
          { "nombre": "Pollo", "descripcion": "Pechuga de pollo" }
        ]
      }
    ]
  }
]
```

### POST /pedidos

**Request:**
```json
{
  "items": [
    {
      "id": "cart-1",
      "comidaId": "1",
      "comidaNombre": "Arroz Aguado",
      "pacienteId": "4752493",
      "pacienteNombre": "Juan Pérez López",
      "flagHoy": true,
      "nota": "Sin sal"
    }
  ],
  "createdAt": "2026-06-17T12:00:00.000Z"
}
```

**Response (201):**
```json
{ "ok": true }
```

## API Real (futuro)

Cuando se tenga acceso a la API del hospital:
- `BASE` cambia en `src/services/api.ts`
- Auth probablemente JWT vía POST con credentials
- Endpoints REST con recursos similares
