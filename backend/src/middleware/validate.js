// Wraps a Joi schema into Express middleware. Pass a schema keyed by the
// request parts you want to check, e.g. validate({ body: registerSchema }).
// Validated (and coerced) values are written back onto req so handlers read
// clean data. Unknown keys are stripped so nothing unexpected reaches the DB.
const validate = (schemas) => {
  return (req, res, next) => {
    const parts = ['body', 'query', 'params'];

    for (const part of parts) {
      const schema = schemas[part];
      if (!schema) continue;

      const { error, value } = schema.validate(req[part], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        return res.status(422).json({
          error: 'Validation failed',
          details: error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message.replace(/"/g, ''),
          })),
        });
      }

      // req.query/params getters are read-only on Express 5, so assign per key.
      Object.assign(req[part], value);
    }

    return next();
  };
};

module.exports = { validate };
