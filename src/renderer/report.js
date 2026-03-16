(() => {
  const feedback = document.getElementById('report-feedback');
  const kpiCards = document.getElementById('kpi-cards');

  function renderList(elementId, rows, emptyLabel = 'Sin datos') {
    const target = document.getElementById(elementId);
    target.innerHTML = '';

    if (!rows || rows.length === 0) {
      const li = document.createElement('li');
      li.textContent = emptyLabel;
      target.appendChild(li);
      return;
    }

    rows.forEach((row) => {
      const li = document.createElement('li');
      const name = row.carrera || row.label || 'Sin dato';
      li.textContent = `${name}: ${row.registros}`;
      target.appendChild(li);
    });
  }

  function renderKpis(kpis) {
    kpiCards.innerHTML = '';
    const items = [
      ['Total de registros históricos', kpis.totalRegistros],
      ['Total de horas acumuladas', kpis.totalHorasAcumuladas],
      ['Promedio de duración (min)', kpis.promedioDuracionMinutos],
      ['Carreras distintas', kpis.carrerasDistintas]
    ];

    items.forEach(([label, value]) => {
      const card = document.createElement('article');
      card.className = 'kpi-card';
      card.innerHTML = `<div>${label}</div><div class="kpi-value">${value}</div>`;
      kpiCards.appendChild(card);
    });
  }

  function renderTablaCarreras(rows) {
    const tbody = document.getElementById('tabla-carreras');
    tbody.innerHTML = '';

    if (!rows || rows.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="4">Sin datos</td>';
      tbody.appendChild(tr);
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.carrera}</td>
        <td>${row.registros}</td>
        <td>${row.horas_acumuladas}</td>
        <td>${row.promedio_duracion}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function loadReport() {
    const response = await window.ciacApi.getReportSummary();
    if (!response.ok) {
      feedback.className = 'feedback error';
      feedback.textContent = response.message || 'No fue posible cargar el informe.';
      return;
    }

    const summary = response.summary;
    feedback.textContent = '';
    renderKpis(summary.kpis);
    renderList('uso-actividad', summary.usoPorActividad);
    renderList('uso-tematica', summary.usoPorTematica);
    renderList('top-carreras', summary.topCarreras);
    renderList('uso-campus', summary.usoPorCampus);
    renderList('uso-semestre', summary.distribucionSemestre);
    renderTablaCarreras(summary.tablaCarreras);
  }

  loadReport();
})();
