
# Especificación funcional - CIAC Registro

## Objetivo
Reemplazar planillas de registro de participación por una aplicación de escritorio para Windows, instalada en recepción, con almacenamiento local y exportación a Excel.

## Flujo principal

### Pantalla 1: Selección de campus
Texto principal:
- Registro de Participación CIAC

Subtexto:
- Selecciona tu campus

Opciones:
- Campus Vitacura
- Campus San Joaquín

Al seleccionar un campus, se navega a la pantalla principal.

### Pantalla 2: Registro principal
Elementos:
- campus seleccionado visible
- fecha automática
- hora automática
- formulario con:
  - RUN
  - DV
  - carrera
  - jornada
  - año ingreso USM
  - actividad
  - temática / asignatura
  - observaciones
- botón registrar
- botón limpiar
- tabla de últimos registros del día
- botón exportar Excel

## Lógica de registro
La app usa un solo botón: Registrar.

### Regla
- Si el RUN no tiene un ingreso abierto en el campus actual, registrar entrada.
- Si el RUN ya tiene un ingreso abierto en el campus actual, registrar salida cerrando ese ingreso.

### Ingreso abierto
Registro con:
- hora_entrada con valor
- hora_salida vacía

### Restricción
Un alumno no puede tener más de un ingreso abierto por campus al mismo tiempo.

## Datos mínimos
- campus
- fecha
- run
- dv
- carrera
- jornada
- año ingreso
- actividad
- temática
- observaciones
- hora entrada
- hora salida
- estado
- duración

## Autocompletado
Si el RUN ya existe en registros anteriores, autocompletar:
- carrera
- jornada
- año ingreso

## Exportación
Debe exportar a Excel los registros del día del campus actual.

Nombre sugerido del archivo:
- registro_ciac_vitacura_YYYY-MM-DD.xlsx
- registro_ciac_san_joaquin_YYYY-MM-DD.xlsx

## Integración beta de escáner
- La aplicación debe quedar preparada para lector tipo pistola que funcione como teclado USB/HID.
- El input de RUN debe aceptar texto escaneado.
- Debe existir una función de parseo adaptable.
- Si el lector agrega Enter al final, debe poder disparar el registro automáticamente.

## Futuras mejoras
- dashboard
- login administrador
- filtros por fecha
- estadísticas
- sincronización
- actualizaciones
- integración avanzada con lector
