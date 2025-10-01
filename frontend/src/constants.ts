// Configuración de URLs del backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://temporary-carolin-nnnnafslsa-b8032478.koyeb.app';
export const WS_URL = import.meta.env.VITE_WS_URL || 'wss://temporary-carolin-nnnnafslsa-b8032478.koyeb.app';

// Constantes compartidas y tipos simples
export const ATTRIBUTE_TYPES = [
  // Tipos primitivos y sus wrappers
  'byte', 'Byte', 'short', 'Short', 'int', 'Integer', 'long', 'Long', 'float', 'Float', 'double', 'Double', 'boolean', 'Boolean', 'char', 'Character',
  // Strings y arrays
  'String', 'char[]', 'byte[]',
  // Números grandes
  'BigInteger', 'BigDecimal',
  // Fechas y tiempo
  'LocalDate', 'LocalTime', 'LocalDateTime', 'Date', 'Calendar', 'Timestamp', 'Instant', 'OffsetDateTime', 'ZonedDateTime', 'Duration', 'Period',
  // Colecciones
  'List<T>', 'Set<T>', 'Map<K,V>', 'Collection<T>',
  // Otros tipos comunes
  'UUID', 'Enum', 'Blob', 'Clob'
];

// Tipos de datos específicos para bases de datos
export const DATABASE_TYPES = {
  POSTGRESQL: [
    'SMALLINT', 'INTEGER', 'BIGINT', 'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION', 
    'SERIAL', 'BIGSERIAL', 'VARCHAR', 'CHAR', 'TEXT', 'BYTEA', 'TIMESTAMP', 'DATE', 
    'TIME', 'BOOLEAN', 'ENUM', 'UUID', 'JSON', 'JSONB'
  ],
  MYSQL: [
    'TINYINT', 'SMALLINT', 'MEDIUMINT', 'INT', 'BIGINT', 'DECIMAL', 'FLOAT', 'DOUBLE', 
    'CHAR', 'VARCHAR', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT', 'BINARY', 'VARBINARY', 
    'TINYBLOB', 'BLOB', 'MEDIUMBLOB', 'LONGBLOB', 'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 
    'YEAR', 'BOOLEAN', 'JSON'
  ]
};

// Constantes de restricciones
export const CONSTRAINTS = [
  'NOT NULL', 'UNIQUE', 'DEFAULT', 'CHECK', 'PRIMARY KEY', 'FOREIGN KEY'
];

// Tipos de relación
export const RELATION_TYPES = {
  ONE_TO_ONE: "ONE_TO_ONE",
  ONE_TO_MANY: "ONE_TO_MANY",
  MANY_TO_ONE: "MANY_TO_ONE",
  MANY_TO_MANY: "MANY_TO_MANY"
};

// Tipos de base de datos soportados
export const DATABASE_PLATFORMS = {
  POSTGRESQL: "PostgreSQL",
  MYSQL: "MySQL",
  H2: "H2"
};

// Temas para PDF
export const PDF_THEMES = {
  DEFAULT: "default",
  DARK: "dark",
  LIGHT: "light",
  COLORFUL: "colorful",
  PROFESSIONAL: "professional",
  MINIMAL: "minimal"
};

// Estrategias de herencia JPA
export const INHERITANCE_STRATEGIES = {
  SINGLE_TABLE: "SINGLE_TABLE",
  JOINED: "JOINED",
  TABLE_PER_CLASS: "TABLE_PER_CLASS"
};

// Discriminador para herencia
export const DISCRIMINATOR_TYPES = {
  STRING: "String",
  CHAR: "Character",
  INTEGER: "Integer",
  LONG: "Long"
};

// Tipos de validaciones de campos comunes
export const VALIDATION_ANNOTATIONS = [
  "@NotNull",
  "@NotBlank",
  "@NotEmpty",
  "@Size",
  "@Min",
  "@Max",
  "@Pattern",
  "@Email",
  "@Future",
  "@Past",
  "@Positive",
  "@Negative"
];

export const MOBILE_BREAKPOINT = 768; // ancho en px para considerar móvil
