// Valida (y normaliza) req.body con un esquema zod. Si falla, el error cae en el errorHandler.
export const validate = (schema) => (req, _res, next) => {
  req.body = schema.parse(req.body);
  next();
};
