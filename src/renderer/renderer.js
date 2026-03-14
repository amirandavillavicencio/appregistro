(() => {
  const state = {
    campus: ''
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
  const actividadInput = document.getElementById('actividad');
  const tematicaInput = document.getElementById('tematica');
  const observacionesInput = document.getElementById('observaciones');

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
    tematicaInput.value = '';
    observacionesInput.value = '';
  }

  function rowCell(value) {
    return value === null || value === undefined || value === '' ? '-' : String(value);
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
      `;
      recordsBody.appendChild(tr);
    });
  }

  async function handleCampusSelection(campus) {
    state.campus = campus;
    campusLabel.textContent = state.campus;
    campusScreen.classList.remove('active');
    mainScreen.classList.add('active');
    updateClock();
    await loadRecords();
    runInput.focus();
  }

  async function normalizeRunDvFromInput() {
    const parsed = await window.ciacApi.parseScannedInput(`${runInput.value}-${dvInput.value}`);
    if (parsed.isValid) {
      runInput.value = parsed.run;
      dvInput.value = parsed.dv;
      return parsed.run;
    }

    const fallbackRun = runInput.value.replace(/[^0-9]/g, '');
    const fallbackDv = dvInput.value.toUpperCase().replace(/[^0-9K]/g, '');
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
    if (response.profile) {
      carreraInput.value = response.profile.carrera || '';
      jornadaInput.value = response.profile.jornada || '';
      anioIngresoInput.value = response.profile.anio_ingreso || '';
    }
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
    const response = await window.ciacApi.exportTodayExcel(state.campus);
    setFeedback(response.message, 'success');
  });

  runInput.addEventListener('blur', async () => {
    await onRunBlur();
  });

  runInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const parsed = await window.ciacApi.parseScannedInput(runInput.value);
      if (parsed.isValid) {
        runInput.value = parsed.run;
        dvInput.value = parsed.dv;
      }
      await handleSubmit();
    }
  });

  setInterval(updateClock, 1000);
})();
