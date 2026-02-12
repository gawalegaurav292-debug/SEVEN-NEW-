
export function brandStrictMiddleware(req, res, next) {
  const { options } = req.body;
  // If brandFilter is present, we enforce strict mode implicitly in the DB layer.
  // We no longer block requests without it, but instead flag them.
  if (options && options.brandFilter) {
    req.isBrandStrict = true;
  }
  next();
}
