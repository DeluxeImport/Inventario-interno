// Envuelve handlers async para que cualquier error caiga en el errorHandler central.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
