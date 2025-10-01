# Configuración del Proyecto Django

## Variables de Entorno

Este proyecto utiliza un archivo `.env` para gestionar configuraciones sensibles y específicas del entorno.

### Configuración Inicial

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` con tus credenciales reales.

### Variables Disponibles

#### Base de Datos
```env
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/basedatos?sslmode=require
```
Cadena de conexión completa a PostgreSQL (Supabase u otro proveedor).

#### API de Google Gemini
```env
GOOGLE_API_KEY=tu_clave_api_aqui
```
Clave para usar la API de Google Gemini para generación de diagramas y paneles CRUD con IA.

#### Configuración CORS

**Modo Desarrollo (desactivado - permite todo):**
```env
CORS_ALLOWED_ORIGINS=*
```

**Modo Producción (activado - orígenes específicos):**
```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://tudominio.com,https://www.tudominio.com
```
Separa múltiples orígenes con comas.

**Permitir Credenciales:**
```env
CORS_ALLOW_CREDENTIALS=true
```
Permite enviar cookies y headers de autenticación en peticiones CORS.

#### Modo Debug
```env
DEBUG=true   # Para desarrollo
DEBUG=false  # Para producción
```

### Seguridad

⚠️ **IMPORTANTE**: 
- Nunca subas el archivo `.env` al repositorio Git
- En producción, configura `CORS_ALLOWED_ORIGINS` con dominios específicos
- Desactiva `DEBUG=false` en producción
- Usa `ALLOWED_HOSTS` con tu dominio real en producción

### Instalación de Dependencias

```bash
pip install -r requirements.txt
```

### Ejecutar el Servidor

```bash
python manage.py runserver
```

## Estructura de Variables por Entorno

### Desarrollo Local
```env
DEBUG=true
CORS_ALLOWED_ORIGINS=*
CORS_ALLOW_CREDENTIALS=true
DATABASE_URL=postgresql://...local...
GOOGLE_API_KEY=...
```

### Producción
```env
DEBUG=false
CORS_ALLOWED_ORIGINS=https://tuapp.com,https://www.tuapp.com
CORS_ALLOW_CREDENTIALS=true
DATABASE_URL=postgresql://...produccion...
GOOGLE_API_KEY=...
```
