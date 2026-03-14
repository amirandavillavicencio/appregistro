# CIAC Registro (MVP V1)

Aplicación de escritorio para Windows construida con **Electron + Node.js + SQLite** para registrar entradas y salidas de estudiantes en recepción CIAC y exportar resultados diarios a Excel.

## Funcionalidades incluidas (V1)

- Selección de campus (Vitacura / San Joaquín).
- Registro principal con formulario de datos del estudiante.
- Lógica automática de entrada/salida con un solo botón **Registrar**:
  - Si no existe ingreso abierto en campus+RUN, crea entrada.
  - Si existe ingreso abierto en campus+RUN, cierra con salida.
- Persistencia local con SQLite en `data/ciac_registro.db`.
- Tabla con últimos registros del día del campus seleccionado.
- Exportación a Excel (`.xlsx`) de los registros del día del campus actual.
- Autocompletado básico por RUN previo (carrera, jornada, año ingreso).
- Soporte beta para escáner tipo teclado (parseo desacoplado con `parseScannedInput`).

## Estructura

```txt
/src
  /main        # proceso principal Electron + IPC
  /renderer    # UI (HTML/CSS/JS)
  /database    # conexión e inicialización SQLite
  /services    # lógica de negocio y exportación
  /utils       # validaciones, fechas y parser de escáner
/data          # base local y exportaciones xlsx
```

## Decisiones de implementación (MVP)

- Validación RUN/DV implementa formato básico para MVP (sin algoritmo completo de DV chileno).
- Exportación Excel se guarda en carpeta `data/` para mantener operación local simple y estable.
- La detección de entrada/salida se centraliza en servicio de negocio para evitar mezclar lógica con UI.

## Requisitos

- Node.js 18+
- npm 9+

## Instalación y ejecución

```bash
npm install
npm start
```

La app inicializa automáticamente la base de datos SQLite y crea índices en primer inicio.

## Base de datos

Tabla principal: `attendance_records`.

Campos: `id`, `campus`, `fecha`, `run`, `dv`, `carrera`, `jornada`, `anio_ingreso`, `actividad`, `tematica`, `observaciones`, `hora_entrada`, `hora_salida`, `estado`, `duracion_minutos`, `created_at`.

Índices creados:

- `idx_attendance_run`
- `idx_attendance_fecha`

## Exportación Excel

Botón: **Exportar Excel**

Formato de nombre:

```txt
registro_ciac_[campus]_[fecha].xlsx
```

Ejemplo:

```txt
registro_ciac_campus_vitacura_2026-03-14.xlsx
```
