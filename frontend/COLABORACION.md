# Configuración de Colaboración en Tiempo Real

## ¿Qué es?

La funcionalidad de colaboración permite que múltiples usuarios trabajen simultáneamente en el mismo diagrama ER, viendo los cambios de otros en tiempo real.

## Instalación y Configuración

### 1. Servidor WebSocket para Colaboración

Para que funcione la colaboración entre navegadores, necesitas un servidor WebSocket corriendo.

**Opción 1: Servidor incluido (Recomendado)**
```bash
# En una terminal separada, ejecutar:
npm run collab
```

**Opción 2: Servidor personalizado**
```bash
# Instalar y ejecutar servidor YJS
npx y-websocket-server --port 1234
```

### 2. Verificar la conexión

1. Abre la aplicación en dos navegadores diferentes
2. Crea o abre un diagrama
3. En la consola del navegador deberías ver:
   ```
   🚀 Creando room de colaboración: {roomId: "...", url: "ws://localhost:1234"}
   📡 WebSocket status para room "...": connected
   🔄 Sincronización completada para room "..."
   ```

### 3. Probar la colaboración

1. En el primer navegador, crea una nueva tabla
2. En el segundo navegador, deberías ver aparecer la tabla automáticamente
3. Prueba agregar atributos, conectar tablas, etc.

## Solución de Problemas

### Error: WebSocket desconectado
**Síntoma**: Ves en la consola `⚠️ WebSocket desconectado`
**Solución**: 
1. Ejecuta `npm run collab` en una terminal separada
2. Recarga la página

### Los cambios no se sincronizan
**Síntoma**: Los cambios aparecen en un navegador pero no en el otro
**Verificar**:
1. Que ambos navegadores estén conectados al mismo websocket (mismo `roomId` en consola)
2. Que no haya errores de JavaScript en la consola
3. Que el servidor websocket esté corriendo

### Rendimiento lento
**Síntoma**: Los cambios tardan mucho en aparecer
**Solución**:
- Los cambios se envían cada 300ms (debounced)
- Si hay muchos usuarios, considera usar un servidor websocket más robusto

## Arquitectura Técnica

- **YJS**: Sistema de CRDT (Conflict-free Replicated Data Types) para sincronización
- **WebSocket**: Protocolo de comunicación en tiempo real
- **Awareness**: Sistema de presencia de usuarios (quién está online)

## Configuración Avanzada

### Cambiar el puerto del servidor
Edita `src/services/collab.ts`:
```typescript
const url = opts.url || 'ws://localhost:PUERTO';
```

Y actualiza el script en `package.json`:
```json
"collab": "y-websocket-server --port PUERTO"
```
