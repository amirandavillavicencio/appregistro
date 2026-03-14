function normalizeRun(rawRun) {
  return String(rawRun || '').replace(/[^0-9]/g, '');
}

function normalizeDv(rawDv) {
  return String(rawDv || '').trim().toUpperCase().replace(/[^0-9K]/g, '');
}

function validateRunDv(run, dv) {
  const normalizedRun = normalizeRun(run);
  const normalizedDv = normalizeDv(dv);

  if (!normalizedRun) {
    return { valid: false, message: 'RUN es obligatorio.' };
  }

  if (!normalizedDv) {
    return { valid: false, message: 'DV es obligatorio.' };
  }

  if (!/^\d{7,9}$/.test(normalizedRun)) {
    return { valid: false, message: 'RUN debe tener entre 7 y 9 dígitos numéricos.' };
  }

  if (!/^[0-9K]$/.test(normalizedDv)) {
    return { valid: false, message: 'DV debe ser un dígito o K.' };
  }

  return {
    valid: true,
    run: normalizedRun,
    dv: normalizedDv
  };
}

module.exports = {
  validateRunDv,
  normalizeRun,
  normalizeDv
};
