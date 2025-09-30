# Diseñador de Bases de Datos ER

Una aplicación web para diseñar visualmente bases de datos y exportar diagramas ER, código Java para Spring Boot, y documentación en PDF.

## Características

- **Diseño visual de bases de datos**: Crea y edita tablas con interfaz drag & drop.
- **Atributos avanzados**: Define columnas con nombre, tipo de dato, restricciones (NOT NULL, UNIQUE, etc.) y claves primarias.
- **Relaciones**: Crea relaciones entre tablas (uno a uno, uno a muchos, muchos a muchos).
- **Validación**: Verificación de consistencia de relaciones y sugerencias de normalización.
- **Herencia de entidades**: Soporte para estrategias de herencia JPA (@Inheritance).
- **Exportación de código**: Genera código Java para Spring Boot 3 (entidades, repositorios, DTOs, servicios).
- **Exportación a PDF**: Genera documentación con diagramas y código fuente.
- **Exportación SQL**: Genera scripts SQL para PostgreSQL y MySQL.
- **Guardar/cargar proyectos**: Preserva tus diseños para continuar trabajando más tarde.

## Requisitos

- Node.js (v18 o superior)
- npm o yarn

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd frontend

# Instalar dependencias
npm install
# o
yarn install
```

## Ejecutar la aplicación

```bash
# Iniciar en modo desarrollo
npm run dev
# o
yarn dev
```

Visita `http://localhost:5173` en tu navegador para usar la aplicación.

## Guía de uso

### Creación de tablas

1. **Crear una tabla**: Haz clic derecho en el lienzo y selecciona "Nueva tabla".
2. **Agregar atributos**: Haz clic derecho en una tabla y selecciona "Agregar atributo".
3. **Configurar atributos**: Define nombre, tipo de dato, si es clave primaria, restricciones, etc.

### Creación de relaciones

1. **Crear relación**: Arrastra desde un punto de conexión de una tabla a otra.
2. **Configurar relación**: Define el tipo (uno a uno, uno a muchos, etc.) y los atributos involucrados.

### Herencia de entidades

1. **Configurar herencia**: Haz clic derecho en una tabla y selecciona "Configurar herencia".
2. **Definir estrategia**: Elige entre SINGLE_TABLE, JOINED o TABLE_PER_CLASS.
3. **Establecer relaciones padre-hijo**: Define qué tabla es padre y cuál es hija.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
