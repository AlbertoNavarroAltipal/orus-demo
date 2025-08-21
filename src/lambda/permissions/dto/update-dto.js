function validateUpdateDto(body) {
  const errors = [];
  const dto = {};

  // Validar descripción
  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      errors.push("La descripción debe ser texto.");
    } else if (body.description.length < 10 || body.description.length > 100) {
      errors.push("La descripción debe tener entre 10 y 100 caracteres.");
    } else {
      dto.description = body.description;
    }
  }

  // Validar root
  if (body.root !== undefined) {
    if (typeof body.root !== "boolean") {
      errors.push("El campo root debe ser verdadero o falso.");
    } else {
      dto.root = body.root;
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
  return dto;
}

module.exports = { validateUpdateDto };
