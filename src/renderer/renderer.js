(() => {
  const state = {
    campus: '',
    closingRecordIds: new Set()
  };

  const ESPACIOS_POR_CAMPUS = {
    'Campus Vitacura': ['Espacio Común CIAC'],
    'Campus San Joaquín': ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Sala 5', 'Sala 6', 'Espacio Común CIAC']
  };

  const campusScreen = document.getElementById('screen-campus');
  const mainScreen = document.getElementById('screen-main');
  const campusLabel = document.getElementById('campus-label');
  const fechaLabel = document.getElementById('fecha-label');
  const horaLabel = document.getElementById('hora-label');
  const feedback = document.getElementById('feedback');
  const recordsBody = document.getElementById('records-body');

  const form = document.getElementById('registro-form');
  const runInput = document.getElementById('run');
  const dvInput = document.getElementById('dv');
  const carreraInput = document.getElementById('carrera');
  const jornadaInput = document.getElementById('jornada');
  const anioIngresoInput = document.getElementById('anioIngreso');
  const semestreEstimadoInput = document.getElementById('semestreEstimado');
  const actividadInput = document.getElementById('actividad');
  const espacioInput = document.getElementById('espacio');
  const tematicaInput = document.getElementById('tematica');
  const observacionesInput = document.getElementById('observaciones');

  const CARRERAS_SAN_JOAQUIN = [
    'Plan Común de Ingenierías y Licenciaturas',
    'Ingeniería Civil',
    'Ingeniería Civil Eléctrica',
    'Ingeniería Civil Informática',
    'Ingeniería Civil Mecánica',
    'Ingeniería Civil de Minas',
    'Ingeniería Civil Química',
    'Ingeniería Civil Matemática',
    'Ingeniería Civil Telemática',
    'Ingeniería Civil Física',
    'Licenciatura en Astrofísica',
    'Licenciatura en Física',
    'Ingeniería en Diseño de Productos',
    'Técnico Universitario en Construcción',
    'Técnico Universitario en Control de Alimentos',
    'Técnico Universitario en Control del Medio Ambiente',
    'Técnico Universitario en Electricidad',
    'Técnico Universitario en Electrónica',
    'Técnico Universitario en Energías Renovables',
    'Técnico Universitario en Mantenimiento Industrial',
    'Técnico Universitario en Mecánica Automotriz',
    'Técnico Universitario en Mecánica Industrial',
    'Técnico Universitario en Informática',
    'Técnico Universitario en Proyectos de Ingeniería',
    'Técnico Universitario en Telecomunicaciones y Redes',
    'Técnico Universitario en Minería y Metalurgia',
    'Técnico Universitario en Química (mención Química Analítica)',
    'Técnico Universitario en Matricería para plásticos y metales',
    'Técnico Universitario en Prevención de Riesgos'
  ];

  const ACTIVIDADES = [
    'Estudio Personal',
    'Consultas',
    'Psicoeducativo Grupal',
    'Psicoeducativo Individual'
  ];

  function setSelectOptions(selectElement, options) {
    const placeholder = selectElement.querySelector('option[value=""]');
    selectElement.innerHTML = '';

    if (placeholder) {
      selectElement.appendChild(placeholder);
    }

    options.forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      selectElement.appendChild(option);
    });
  }

  function syncEspaciosByCampus() {
    const currentValue = espacioInput.value;
    const espacios = ESPACIOS_POR_CAMPUS[state.campus] || [];
    setSelectOptions(espacioInput, espacios);

    if (espacios.includes(currentValue)) {
      espacioInput.value = currentValue;
    } else {
      espacioInput.value = '';
    }
  }

  function buildIngresoYears() {
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let year = 2020; year <= currentYear; year += 1) {
      years.push(String(year));
    }

    return years;
  }

  function setSelectValue(selectElement, value) {
    if (!value) {
      selectElement.value = '';
      return;
    }

    const normalizedValue = String(value);
    const hasOption = Array.from(selectElement.options).some((option) => option.value === normalizedValue);

    selectElement.value = hasOption ? normalizedValue : '';
  }

  function sanitizeRunInputValue(rawValue) {
    return String(rawValue || '').replace(/[^0-9]/g, '').slice(0, 8);
  }

  function sanitizeDvInputValue(rawValue) {
    return String(rawValue || '').toUpperCase().replace(/[^0-9K]/g, '').slice(0, 1);
  }

  function getSemestreEstimado(cohorteValue) {
    const cohorte = Number(String(cohorteValue || '').replace(/[^0-9]/g, '').slice(0, 4));
    const currentYear = new Date().getFullYear();

    if (!Number.isInteger(cohorte) || cohorte < 1900 || cohorte > currentYear + 1) {
      return '';
    }

    const currentMonth = new Date().getMonth() + 1;
    const semestreActual = currentMonth <= 6 ? 1 : 2;
    const semestreEstimado = ((currentYear - cohorte) * 2) + semestreActual;

    if (!Number.isInteger(semestreEstimado) || semestreEstimado < 1) {
      return '';
    }

    return String(semestreEstimado);
  }

  function setSemestreEstimado(cohorteValue) {
    const semestreEstimado = getSemestreEstimado(cohorteValue);
    semestreEstimadoInput.value = semestreEstimado || 'No disponible';
  }

  function initializeFormOptions() {
    setSelectOptions(carreraInput, CARRERAS_SAN_JOAQUIN);
    setSelectOptions(anioIngresoInput, buildIngresoYears());
    setSelectOptions(actividadInput, ACTIVIDADES);
    syncEspaciosByCampus();
  }

  function nowParts() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8);
    return { date, time };
  }

  function updateClock() {
    const { date, time } = nowParts();
    fechaLabel.textContent = date;
    horaLabel.textContent = time;
  }

  function setFeedback(message, type = 'success') {
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
  }

  function clearForm(keepRun = false) {
    if (!keepRun) {
      runInput.value = '';
      dvInput.value = '';
    }
    actividadInput.value = '';
    espacioInput.value = '';
    tematicaInput.value = '';
    observacionesInput.value = '';
    semestreEstimadoInput.value = 'No disponible';
  }

  function rowCell(value) {
    return value === null || value === undefined || value === '' ? '-' : String(value);
  }

  function isRecordOpen(record) {
    return record.estado === 'abierto' && (!record.hora_salida || record.hora_salida === '');
  }

  function buildManualCloseButton(record) {
    if (!isRecordOpen(record)) {
      return '<span class="row-action-placeholder">-</span>';
    }

    const isClosing = state.closingRecordIds.has(record.id);
    const label = isClosing ? 'Registrando...' : 'Registrar salida';

    return `<button type="button" class="secondary row-action-btn" data-action="close-record" data-record-id="${record.id}" ${isClosing ? 'disabled' : ''}>${label}</button>`;
  }

  async function loadRecords() {
    const response = await window.ciacApi.getLatestRecords(state.campus);
    recordsBody.innerHTML = '';

    response.records.forEach((record) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${rowCell(record.hora_entrada)}</td>
        <td>${rowCell(record.hora_salida)}</td>
        <td>${rowCell(record.run)}</td>
        <td>${rowCell(record.carrera)}</td>
        <td>${rowCell(record.actividad)}</td>
        <td>${rowCell(record.estado)}</td>
        <td>${buildManualCloseButton(record)}</td>
      `;
      recordsBody.appendChild(tr);
    });
  }

  async function handleManualClose(recordId) {
    if (state.closingRecordIds.has(recordId)) {
      return;
    }

    state.closingRecordIds.add(recordId);
    await loadRecords();

    const response = await window.ciacApi.closeOpenRecord({
      campus: state.campus,
      recordId
    });

    state.closingRecordIds.delete(recordId);

    if (!response.ok) {
      setFeedback(response.message, 'error');
      await loadRecords();
      return;
    }

    setFeedback(response.message, 'success');
    await loadRecords();
  }

  async function handleCampusSelection(campus) {
    state.campus = campus;
    campusLabel.textContent = state.campus;
    syncEspaciosByCampus();
    campusScreen.classList.remove('active');
    mainScreen.classList.add('active');
    updateClock();
    await loadRecords();
    runInput.focus();
  }

  async function normalizeRunDvFromInput() {
    const parsed = await window.ciacApi.parseScannedInput(`${runInput.value}-${dvInput.value}`);
    if (parsed.isValid) {
      runInput.value = sanitizeRunInputValue(parsed.run);
      dvInput.value = sanitizeDvInputValue(parsed.dv);
      return parsed.run;
    }

    const fallbackRun = sanitizeRunInputValue(runInput.value);
    const fallbackDv = sanitizeDvInputValue(dvInput.value);
    runInput.value = fallbackRun;
    dvInput.value = fallbackDv;
    return fallbackRun;
  }

  async function onRunBlur() {
    const runValue = await normalizeRunDvFromInput();
    if (!runValue) {
      return;
    }

    const response = await window.ciacApi.getProfileByRun(runValue);
    if (!response.profile) {
      setSemestreEstimado('');
      return;
    }

    if (response.profile.dv) {
      dvInput.value = sanitizeDvInputValue(response.profile.dv);
    }

    setSelectValue(carreraInput, response.profile.carrera);
    jornadaInput.value = response.profile.jornada || '';
    setSelectValue(anioIngresoInput, response.profile.anio_ingreso);
    setSemestreEstimado(response.profile.cohorte);
  }

  async function handleSubmit() {
    await normalizeRunDvFromInput();

    const payload = {
      campus: state.campus,
      run: runInput.value,
      dv: dvInput.value,
      carrera: carreraInput.value,
      jornada: jornadaInput.value,
      anioIngreso: anioIngresoInput.value,
      actividad: actividadInput.value,
      espacio: espacioInput.value,
      tematica: tematicaInput.value,
      observaciones: observacionesInput.value
    };

    const response = await window.ciacApi.registerAttendance(payload);

    if (!response.ok) {
      setFeedback(response.message, 'error');
      return;
    }

    setFeedback(response.message, 'success');
    await loadRecords();
    clearForm(true);
    runInput.select();
  }

  document.querySelectorAll('[data-campus]').forEach((button) => {
    button.addEventListener('click', async () => {
      await handleCampusSelection(button.dataset.campus);
    });
  });

  recordsBody.addEventListener('click', async (event) => {
    const actionButton = event.target.closest('[data-action="close-record"]');
    if (!actionButton) {
      return;
    }

    const recordId = Number(actionButton.dataset.recordId);
    if (!Number.isInteger(recordId) || recordId <= 0) {
      setFeedback('No fue posible identificar el registro para cierre manual.', 'error');
      return;
    }

    await handleManualClose(recordId);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await handleSubmit();
  });

  document.getElementById('btn-limpiar').addEventListener('click', () => {
    clearForm();
    setFeedback('Formulario limpio.', 'success');
    runInput.focus();
  });

  document.getElementById('btn-exportar').addEventListener('click', async () => {
    try {
      const response = await window.ciacApi.exportHistoricExcel();
      setFeedback(response.message, response.ok ? 'success' : 'error');
    } catch (error) {
      setFeedback(`No fue posible exportar el archivo Excel: ${error.message}`, 'error');
    }
  });

  document.getElementById('btn-informe').addEventListener('click', async () => {
    const response = await window.ciacApi.openReportWindow();
    if (!response.ok) {
      setFeedback('No fue posible abrir la ventana de informe.', 'error');
    }
  });

  runInput.addEventListener('input', () => {
    const sanitizedRun = sanitizeRunInputValue(runInput.value);
    if (runInput.value !== sanitizedRun) {
      runInput.value = sanitizedRun;
    }

    if (sanitizedRun.length === 8 && document.activeElement === runInput) {
      dvInput.focus();
      dvInput.select();
    }
  });

  dvInput.addEventListener('input', () => {
    const sanitizedDv = sanitizeDvInputValue(dvInput.value);
    if (dvInput.value !== sanitizedDv) {
      dvInput.value = sanitizedDv;
    }
  });

  runInput.addEventListener('blur', async () => {
    await onRunBlur();
  });

  runInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const parsed = await window.ciacApi.parseScannedInput(runInput.value);
      if (parsed.isValid) {
        runInput.value = sanitizeRunInputValue(parsed.run);
        dvInput.value = sanitizeDvInputValue(parsed.dv);
      }
      await handleSubmit();
    }
  });

  initializeFormOptions();
  semestreEstimadoInput.value = 'No disponible';
  setInterval(updateClock, 1000);
})();
