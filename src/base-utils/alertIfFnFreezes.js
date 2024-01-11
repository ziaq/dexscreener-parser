const handleError = require('./handleError');

function alertIfFnFreezes(fnName) {
  const timerId = setTimeout(() => {
    handleError(
      'alertIfFnFreezes',
      `${fnName} froze and didn't complete within 5 min`,
      { message: 'Froze' },
    );
  }, 300000); // 5 min

  return timerId;
}

function cancelAlertIfFnFreezes(timerId) {
  clearTimeout(timerId);
}

module.exports = { alertIfFnFreezes, cancelAlertIfFnFreezes };