function pad(value) {
  return String(value).padStart(2, '0');
}

function getCurrentDateTimeParts(date = new Date()) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return {
    fecha: `${year}-${month}-${day}`,
    hora: `${hours}:${minutes}:${seconds}`,
    iso: date.toISOString()
  };
}

function getDurationMinutes(startHHMMSS, endHHMMSS) {
  if (!startHHMMSS || !endHHMMSS) {
    return null;
  }

  const [sh, sm, ss] = startHHMMSS.split(':').map(Number);
  const [eh, em, es] = endHHMMSS.split(':').map(Number);
  const start = (sh * 3600) + (sm * 60) + ss;
  const end = (eh * 3600) + (em * 60) + es;
  return Math.max(0, Math.round((end - start) / 60));
}

module.exports = {
  getCurrentDateTimeParts,
  getDurationMinutes
};
