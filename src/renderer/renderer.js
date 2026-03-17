(() => {
  const state = {
    campus: '',
    activeModule: 'alumnos',
    closingRecordIds: new Set(),
    closingTutorRecordIds: new Set()
  };

  const ESPACIOS_POR_CAMPUS = {
    'Campus Vitacura': ['Espacio Común CIAC'],
    'Campus San Joaquín': ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Sala 5', 'Sala 6', 'Espacio Común CIAC']
  };

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

  const campusScreen = document.getElementById('screen-campus');
  const mainScreen = document.getElementById('screen-main');
  const campusLabel = document.getElementById('campus-label');
  const fechaLabel = document.getElementById('fecha-label');
  const horaLabel = document.getElementById('hora-label');

  const moduleButtons = document.querySelectorAll('.module-btn');
  const alumnosScreen = document.getElementById('module-alumnos');
  const tutoresScreen = document.getElementById('module-tutores');

  const feedback = document.getElementById('feedback');
  const recordsBody = document.getElementById('records-body');
  const form = document.getElementById('registro-form');
  const runInput = document.getElementById('run');
  const dvInput = document.getElementById('dv');
  const carreraInput = document.getElementById('carrera');
  const nombreInput = document.getElementById('nombre');
  const jornadaInput = document.getElementById('jornada');
  const anioIngresoInput = document.getElementById('anioIngreso');
  const semestreEstimadoInput = document.getElementById('semestreEstimado');
  const actividadInput = document.getElementById('actividad');
  const espacioInput = document.getElementById('espacio');
  const tematicaInput = document.getElementById('tematica');
  const observacionesInput = document.getElementById('observaciones');

  const tutorFeedback = document.getElementById('tutor-feedback');
  const tutorRecordsBody = document.getElementById('tutor-records-body');
  const tutorForm = document.getElementById('tutor-form');
  const tutorRunInput = document.getElementById('tutor-run');
  const tutorDvInput = document.getElementById('tutor-dv');
  const tutorNombreInput = document.getElementById('tutor-nombre');
  const tutorTipoInput = document.getElementById('tutor-tipo');
  const tutorObservacionesInput = document.getElementById('tutor-observaciones');

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


  function normalizeJornadaValue(value) {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    if (!normalized) {
      return '';
    }

    if (normalized.startsWith('diurn')) {
      return 'Diurno';
    }

    if (normalized.startsWith('vespertin')) {
      return 'Vespertino';
    }

    return '';
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

  function updateClock() {
    const now = new Date();
    fechaLabel.textContent = now.toISOString().slice(0, 10);
    horaLabel.textContent = now.toTimeString().slice(0, 8);
  }

  function setFeedback(message, type = 'success') {
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
  }

  function setTutorFeedback(message, type = 'success') {
    tutorFeedback.textContent = message;
    tutorFeedback.className = `feedback ${type}`;
  }

  function clearForm(keepRun = false) {
    if (!keepRun) {
      runInput.value = '';
      dvInput.value = '';
    }
    nombreInput.value = '';
    jornadaInput.value = '';
    carreraInput.value = '';
    anioIngresoInput.value = '';
    actividadInput.value = '';
    espacioInput.value = '';
    tematicaInput.value = '';
    observacionesInput.value = '';
    semestreEstimadoInput.value = 'No disponible';
  }

  function clearTutorForm(keepRun = false) {
    if (!keepRun) {
      tutorRunInput.value = '';
      tutorDvInput.value = '';
    }
    tutorNombreInput.value = '';
    tutorTipoInput.value = '';
    tutorObservacionesInput.value = '';
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

  function buildTutorManualCloseButton(record) {
    if (!isRecordOpen(record)) {
      return '<span class="row-action-placeholder">-</span>';
    }

    const isClosing = state.closingTutorRecordIds.has(record.id);
    const label = isClosing ? 'Registrando...' : 'Registrar salida';

    return `<button type="button" class="secondary row-action-btn" data-action="close-tutor-record" data-record-id="${record.id}" ${isClosing ? 'disabled' : ''}>${label}</button>`;
  }

  function setActiveModule(moduleName) {
    state.activeModule = moduleName;
    const isAlumnos = moduleName === 'alumnos';

    alumnosScreen.classList.toggle('active', isAlumnos);
    tutoresScreen.classList.toggle('active', !isAlumnos);

    moduleButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.module === moduleName);
    });

    if (isAlumnos) {
      runInput.focus();
    } else {
      tutorRunInput.focus();
    }
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
        <td>${rowCell(record.nombre)}</td>
        <td>${rowCell(record.carrera)}</td>
        <td>${rowCell(record.actividad)}</td>
        <td>${rowCell(record.estado)}</td>
        <td>${buildManualCloseButton(record)}</td>
      `;
      recordsBody.appendChild(tr);
    });
  }

  async function loadTutorRecords() {
    const response = await window.ciacApi.getLatestTutorRecords(state.campus);
    tutorRecordsBody.innerHTML = '';

    response.records.forEach((record) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${rowCell(record.hora_entrada)}</td>
        <td>${rowCell(record.hora_salida)}</td>
        <td>${rowCell(record.run)}</td>
        <td>${rowCell(record.nombre)}</td>
        <td>${rowCell(record.tipo)}</td>
        <td>${rowCell(record.estado)}</td>
        <td>${buildTutorManualCloseButton(record)}</td>
      `;
      tutorRecordsBody.appendChild(tr);
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

  async function handleTutorManualClose(recordId) {
    if (state.closingTutorRecordIds.has(recordId)) {
      return;
    }

    state.closingTutorRecordIds.add(recordId);
    await loadTutorRecords();

    const response = await window.ciacApi.closeOpenTutorRecord({
      campus: state.campus,
      recordId
    });

    state.closingTutorRecordIds.delete(recordId);

    if (!response.ok) {
      setTutorFeedback(response.message, 'error');
      await loadTutorRecords();
      return;
    }

    setTutorFeedback(response.message, 'success');
    await loadTutorRecords();
  }

  async function handleCampusSelection(campus) {
    state.campus = campus;
    campusLabel.textContent = state.campus;
    syncEspaciosByCampus();
    campusScreen.classList.remove('active');
    mainScreen.classList.add('active');
    updateClock();
    await loadRecords();
    await loadTutorRecords();
    setActiveModule('alumnos');
  }

  async function normalizeRunDvFromInput(runEl, dvEl) {
    const parsed = await window.ciacApi.parseScannedInput(`${runEl.value}-${dvEl.value}`);
    if (parsed.isValid) {
      runEl.value = sanitizeRunInputValue(parsed.run);
      dvEl.value = sanitizeDvInputValue(parsed.dv);
      return parsed.run;
    }

    const fallbackRun = sanitizeRunInputValue(runEl.value);
    const fallbackDv = sanitizeDvInputValue(dvEl.value);
    runEl.value = fallbackRun;
    dvEl.value = fallbackDv;
    return fallbackRun;
  }

  async function onRunBlur() {
    const runValue = await normalizeRunDvFromInput(runInput, dvInput);
    if (!runValue) {
      return;
    }

    const response = await window.ciacApi.getProfileByRun(runValue);
    if (!response.profile) {
      nombreInput.value = '';
      setSelectValue(carreraInput, '');
      setSelectValue(jornadaInput, '');
      setSelectValue(anioIngresoInput, '');
      setSemestreEstimado('');
      return;
    }

    if (response.profile.dv) {
      dvInput.value = sanitizeDvInputValue(response.profile.dv);
    }

    nombreInput.value = response.profile.nombre || '';
    setSelectValue(carreraInput, response.profile.carrera);
    setSelectValue(jornadaInput, normalizeJornadaValue(response.profile.jornada));
    setSelectValue(anioIngresoInput, response.profile.anio_ingreso);
    setSemestreEstimado(response.profile.cohorte);
  }

  async function onTutorRunBlur() {
    const runValue = await normalizeRunDvFromInput(tutorRunInput, tutorDvInput);
    if (!runValue) {
      return;
    }

    const response = await window.ciacApi.getTutorProfileByRun(runValue);
    if (!response.profile) {
      return;
    }

    if (response.profile.dv) {
      tutorDvInput.value = sanitizeDvInputValue(response.profile.dv);
    }

    tutorNombreInput.value = response.profile.nombre || '';
    setSelectValue(tutorTipoInput, response.profile.tipo);
  }

  async function handleSubmit() {
    await normalizeRunDvFromInput(runInput, dvInput);

    const payload = {
      campus: state.campus,
      run: runInput.value,
      dv: dvInput.value,
      nombre: nombreInput.value,
      carrera: carreraInput.value,
      jornada: normalizeJornadaValue(jornadaInput.value),
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

  async function handleTutorSubmit() {
    await normalizeRunDvFromInput(tutorRunInput, tutorDvInput);

    const payload = {
      campus: state.campus,
      run: tutorRunInput.value,
      dv: tutorDvInput.value,
      nombre: tutorNombreInput.value,
      tipo: tutorTipoInput.value,
      observaciones: tutorObservacionesInput.value
    };

    const response = await window.ciacApi.registerTutorAttendance(payload);

    if (!response.ok) {
      setTutorFeedback(response.message, 'error');
      return;
    }

    setTutorFeedback(response.message, 'success');
    await loadTutorRecords();
    clearTutorForm(true);
    tutorRunInput.select();
  }

  document.querySelectorAll('[data-campus]').forEach((button) => {
    button.addEventListener('click', async () => {
      await handleCampusSelection(button.dataset.campus);
    });
  });

  moduleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setActiveModule(button.dataset.module);
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

  tutorRecordsBody.addEventListener('click', async (event) => {
    const actionButton = event.target.closest('[data-action="close-tutor-record"]');
    if (!actionButton) {
      return;
    }

    const recordId = Number(actionButton.dataset.recordId);
    if (!Number.isInteger(recordId) || recordId <= 0) {
      setTutorFeedback('No fue posible identificar el registro para cierre manual.', 'error');
      return;
    }

    await handleTutorManualClose(recordId);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await handleSubmit();
  });

  tutorForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await handleTutorSubmit();
  });

  document.getElementById('btn-limpiar').addEventListener('click', () => {
    clearForm();
    setFeedback('Formulario limpio.', 'success');
    runInput.focus();
  });

  document.getElementById('btn-tutor-limpiar').addEventListener('click', () => {
    clearTutorForm();
    setTutorFeedback('Formulario de tutores limpio.', 'success');
    tutorRunInput.focus();
  });

  document.getElementById('btn-exportar').addEventListener('click', async () => {
    const response = await window.ciacApi.exportHistoricExcel();
    setFeedback(response.message, response.ok ? 'success' : 'error');
  });

  document.getElementById('btn-tutor-exportar').addEventListener('click', async () => {
    const response = await window.ciacApi.exportTutorHistoricExcel();
    setTutorFeedback(response.message, response.ok ? 'success' : 'error');
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

  tutorRunInput.addEventListener('input', () => {
    const sanitizedRun = sanitizeRunInputValue(tutorRunInput.value);
    if (tutorRunInput.value !== sanitizedRun) {
      tutorRunInput.value = sanitizedRun;
    }

    if (sanitizedRun.length === 8 && document.activeElement === tutorRunInput) {
      tutorDvInput.focus();
      tutorDvInput.select();
    }
  });

  dvInput.addEventListener('input', () => {
    const sanitizedDv = sanitizeDvInputValue(dvInput.value);
    if (dvInput.value !== sanitizedDv) {
      dvInput.value = sanitizedDv;
    }
  });

  tutorDvInput.addEventListener('input', () => {
    const sanitizedDv = sanitizeDvInputValue(tutorDvInput.value);
    if (tutorDvInput.value !== sanitizedDv) {
      tutorDvInput.value = sanitizedDv;
    }
  });

  runInput.addEventListener('blur', async () => {
    await onRunBlur();
  });

  tutorRunInput.addEventListener('blur', async () => {
    await onTutorRunBlur();
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

  tutorRunInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const parsed = await window.ciacApi.parseScannedInput(tutorRunInput.value);
      if (parsed.isValid) {
        tutorRunInput.value = sanitizeRunInputValue(parsed.run);
        tutorDvInput.value = sanitizeDvInputValue(parsed.dv);
      }
      await handleTutorSubmit();
    }
  });

  initializeFormOptions();
  semestreEstimadoInput.value = 'No disponible';
  setInterval(updateClock, 1000);
})();
