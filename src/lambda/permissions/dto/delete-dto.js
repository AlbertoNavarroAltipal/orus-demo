function validateDeleteDto(params) {
  const errors = [];
  const dto = {};

  if (params.code === undefined) {
    errors.push("El campo 'code' es obligatorio.");
  } else if (typeof params.code !== "string") {
    errors.push("El campo 'code' debe ser texto.");
  } else {
    dto.code = params.code;
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
  return dto;
}

module.exports = { validateDeleteDto };
