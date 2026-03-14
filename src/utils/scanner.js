function parseScannedInput(rawInput = '') {
  const cleaned = String(rawInput)
    .trim()
    .replace(/\s+/g, '')
    .replace(/[‐‑‒–—−]/g, '-')
    .toUpperCase();

  const basicMatch = cleaned.match(/(\d{7,9})[-.]?([0-9K])/);

  if (!basicMatch) {
    return {
      isValid: false,
      run: '',
      dv: '',
      original: rawInput,
      cleaned
    };
  }

  return {
    isValid: true,
    run: basicMatch[1],
    dv: basicMatch[2],
    original: rawInput,
    cleaned
  };
}

module.exports = {
  parseScannedInput
};
