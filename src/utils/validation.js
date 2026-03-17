function normalizeRun(rawRun) {
  return String(rawRun || '').replace(/[^0-9]/g, '');
}

function normalizeDv(rawDv) {
  return String(rawDv || '').trim().toUpperCase().replace(/[^0-9K]/g, '');
}

function calculateRutDv(run) {
  const reversedDigits = String(run).split('').reverse();
  const series = [2, 3, 4, 5, 6, 7];

  const sum = reversedDigits.reduce((acc, digit, index) => {
    const multiplier = series[index % series.length];
    return acc + Number(digit) * multiplier;
  }, 0);

  const remainder = 11 - (sum % 11);

  if (remainder === 11) {
    return '0';
  }

  if (remainder === 10) {
    return 'K';
  }

  return String(remainder);
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

  const expectedDv = calculateRutDv(normalizedRun);

  if (normalizedDv !== expectedDv) {
    return { valid: false, message: 'RUN o DV inválido. Verifique e intente nuevamente.' };
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
  normalizeDv,
  calculateRutDv
};
