# Configuración de Frontend - Variables de Entorno

## 🚀 Configuración para Producción

El frontend ahora está configurado para usar tu backend en producción:
- **Backend API**: `https://temporary-carolin-nnnnafslsa-b8032478.koyeb.app`
- **WebSocket**: `wss://temporary-carolin-nnnnafslsa-b8032478.koyeb.app`

## 📁 Archivos de Variables de Entorno

### `.env.development` (Desarrollo Local)
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:1234
```

### `.env.production` (Producción)
```env
VITE_API_URL=https://temporary-carolin-nnnnafslsa-b8032478.koyeb.app
VITE_WS_URL=wss://temporary-carolin-nnnnafslsa-b8032478.koyeb.app
```

## 🔧 Uso en el Código

Las constantes se importan desde `src/constants.ts`:

```typescript
import { API_BASE_URL, WS_URL } from './constants';
```

Vite automáticamente usa:
- `.env.development` cuando ejecutas `npm run dev`
- `.env.production` cuando ejecutas `npm run build`

## 📝 Archivos Actualizados

1. ✅ `src/constants.ts` - Constantes de configuración
2. ✅ `src/services/api.ts` - Cliente API axios
3. ✅ `src/services/collab.ts` - WebSocket de colaboración
4. ✅ `src/utils/SpringBootExporter.ts` - CORS en código generado

## 🛠️ Comandos

### Desarrollo Local
```bash
npm run dev
```
Usa `.env.development` → conecta a `localhost:8000`

### Build para Producción
```bash
npm run build
```
Usa `.env.production` → conecta a tu backend en Koyeb

### Preview de Build
```bash
npm run preview
```
Previsualiza el build de producción localmente

## 🌐 Despliegue en Render

Para Render, configura estas **Environment Variables**:

```
VITE_API_URL=https://temporary-carolin-nnnnafslsa-b8032478.koyeb.app
VITE_WS_URL=wss://temporary-carolin-nnnnafslsa-b8032478.koyeb.app
```

### Configuración de Render:
```
Name: fre
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

## ⚠️ Importante

- El archivo `.env.local` es ignorado por Git (para sobrescribir localmente)
- `.env.production` se usa automáticamente en builds de producción
- Las variables deben empezar con `VITE_` para ser accesibles en el frontend

## 🔄 WebSocket para Colaboración

Si tu backend en Koyeb **NO** tiene un servidor WebSocket de Yjs corriendo, necesitarás:

1. **Opción A**: Desplegar el servidor de colaboración por separado
   ```bash
   # En el directorio frontend
   npm run collab  # Corre en puerto 1234
   ```

2. **Opción B**: Usar Yjs con Redis o PostgreSQL como backend
   - Cambiar de `y-websocket` a `y-redis` o `y-indexeddb`

3. **Opción C**: Desactivar la colaboración en tiempo real temporalmente
   - Comentar el código de `collab.ts` en `DiagramViewer.tsx`

## 📦 Despliegue Completo

Para un despliegue completo, necesitas:

1. ✅ Backend Django en Koyeb (ya desplegado)
2. 🔄 Frontend en Render (en configuración)
3. ⚠️ Servidor WebSocket para colaboración (pendiente o desactivar)

## 🐛 Debugging

Si tienes problemas de conexión:

1. Verifica que el backend esté accesible:
   ```bash
   curl https://temporary-carolin-nnnnafslsa-b8032478.koyeb.app/api/
   ```

2. Revisa la consola del navegador para errores de CORS

3. Asegúrate de que el backend tenga configurado CORS para tu dominio de Render
