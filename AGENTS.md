
# Reglas del proyecto CIAC Registro

## Objetivo
Construir una app de escritorio para Windows orientada a recepción del CIAC, para registrar entradas y salidas de estudiantes y exportar registros a Excel.

## Reglas de arquitectura
- Mantener separación entre UI, lógica de negocio y acceso a datos.
- No mezclar lógica de base de datos directamente en componentes visuales.
- Mantener el código modular y preparado para futuras actualizaciones.
- Toda nueva funcionalidad debe respetar el flujo principal:
  1. selección de campus
  2. pantalla de registro
  3. registro automático de entrada o salida según estado previo
- No romper compatibilidad de base de datos sin dejar migración o ajuste claro.
- La exportación a Excel es parte central del sistema y debe mantenerse funcional.
- La integración con escáner debe permanecer desacoplada para poder cambiarla después.
- Priorizar estabilidad, simplicidad y rapidez de uso por sobre complejidad visual.

## Reglas funcionales
- Un alumno no puede tener más de un ingreso abierto por campus al mismo tiempo.
- Si el RUN no tiene ingreso abierto, el botón registrar debe crear entrada.
- Si el RUN ya tiene ingreso abierto, el botón registrar debe cerrar con salida.
- Debe validarse RUN y DV.
- Debe mostrarse feedback claro al usuario después de cada registro.
- Debe existir exportación a Excel de los registros del día del campus actual.

## En caso de duda
Tomar decisiones conservadoras, simples y mantenibles.
