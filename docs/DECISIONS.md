# Decisiones Técnicas (ADRs)

## ADR-001: AsyncStorage vs Encrypted Storage

**Contexto**: Necesitamos persistir el token JWT para mantener sesión.

**Decisión**: Usar AsyncStorage en desarrollo, migrar a react-native-encrypted-storage antes de producción.

**Razón**: AsyncStorage funciona en Expo Go sin config nativa. Migrar implica cambiar 1 archivo (`src/services/storage.ts`).

**Estado**: ✅ Aprobado (migración pendiente para producción)

---

## ADR-002: Zustand vs Redux/Context

**Contexto**: Estado global (auth, carrito).

**Decisión**: Zustand.

**Razón**: API simple, no boilerplate, tiene persist middleware. Suficiente para este proyecto.

**Estado**: ✅ Aprobado

---

## ADR-003: react-hook-form + zod

**Contexto**: Manejo de formularios (login, notas, búsquedas).

**Decisión**: react-hook-form + @hookform/resolvers + zod.

**Razón**: Validación typesafe con zod, performance de RHF, reutilizable entre screens.

**Estado**: ✅ Aprobado

---

## ADR-004: json-server como mock

**Contexto**: La API real del hospital existe pero no tenemos acceso.

**Decisión**: json-server con db.json. Endpoints falsos simulados.

**Razón**: Rápido de configurar, permite desarrollo frontend sin backend.

**Estado**: ✅ Aprobado (reemplazar por API real cuando se tenga acceso)

---

## ADR-005: react-native-responsive-screen

**Contexto**: Adaptación a phones y tablets.

**Decisión**: react-native-responsive-screen con `wp()`/`hp()`.

**Razón**: Porcentajes cross-device vs Dimensions API manual.

**Estado**: ✅ Aprobado

---

## ADR-006: Expo Router (file-based routing)

**Contexto**: Navegación.

**Decisión**: expo-router (viene con el template SDK 56).

**Razón**: Ya incluido, routing basado en archivos, integración con Expo.

**Estado**: ✅ Aprobado

---

## ADR-007: TypeScript strict

**Contexto**: Tipado.

**Decisión**: TypeScript strict mode (ya en tsconfig).

**Razón**: Código más seguro y mantenible.

**Estado**: ✅ Aprobado
