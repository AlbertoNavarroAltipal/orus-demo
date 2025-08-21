function validateQueryDto(query) {
  // Validaciones manuales para JS puro
  const errors = [];
  if (query.page !== undefined && isNaN(parseInt(query.page, 10))) {
    errors.push({
      field: "page",
      message: "El parámetro 'page' debe ser un número.",
    });
  }
  if (query.per_page !== undefined && isNaN(parseInt(query.per_page, 10))) {
    errors.push({
      field: "per_page",
      message: "El parámetro 'per_page' debe ser un número.",
    });
  }
  ["sort", "filter_code", "filter_description", "filter_root"].forEach(
    (field) => {
      if (query[field] !== undefined && typeof query[field] !== "string") {
        errors.push({
          field,
          message: `El parámetro '${field}' debe ser texto.`,
        });
      }
    }
  );
  // filter_or puede ser string (JSON) o array
  if (
    query.filter_or !== undefined &&
    !(typeof query.filter_or === "string" || Array.isArray(query.filter_or))
  ) {
    errors.push({
      field: "filter_or",
      message: "El parámetro 'filter_or' debe ser un string JSON o un array.",
    });
  }
  if (errors.length > 0) {
    throw new Error("Validation failed: " + JSON.stringify(errors));
  }
  return query;
}

module.exports = { validateQueryDto };
