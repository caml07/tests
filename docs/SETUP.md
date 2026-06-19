# Setup

## Requisitos

- Node.js 18+
- Expo CLI (`npx expo`)

## Instalación

```bash
npm install
```

## Desarrollo

### 1. Iniciar json-server (mock API)

```bash
npx json-server --watch docs/db.json --port 3001
```

### 2. Iniciar la app

```bash
npm start
```

Escanea el QR con Expo Go (Android/iOS) o presiona `a` para Android, `i` para iOS, `w` para web.

## Mock API

Puerto: `3001`  
Base URL: `http://localhost:3001`

Endpoints:

| Método | Path | Descripción |
|---|---|---|
| GET | `/nurses?usuario=X&password=Y` | Login |
| GET | `/stations` | Lista estaciones |
| GET | `/patients?stationId=X` | Pacientes por estación |
| GET | `/comidas?dietaId=X&tiempo=Y` | Menú por dieta y tiempo |
| POST | `/pedidos` | Enviar pedido |

## Usuarios de prueba

| Usuario | Password | Nombre |
|---|---|---|
| `andrea` | `1234` | Enfermera Andrea |
| `carlos` | `1234` | Enfermero Carlos |
| `maria` | `1234` | Enfermera Maria |

## Scripts disponibles

```bash
npm start       # Expo dev server
npm run android # Build + run Android
npm run ios     # Build + run iOS
npm run web     # Web version
```
