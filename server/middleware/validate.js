const { validationResult } = require('express-validator');

/** Collects express-validator results and returns a 400 response when invalid. */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));

  return res.status(400).json({
    success: false,
    message: details[0]?.message || 'Validation failed',
    errors: details,
  });
}

module.exports = validate;
