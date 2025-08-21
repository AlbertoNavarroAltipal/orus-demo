function validateCreateDto(body) {
  const errors = [];
  // code: obligatorio, string, regex
  if (!body.code || typeof body.code !== "string") {
    errors.push("El código es obligatorio y debe ser texto.");
  } else if (!/^[a-z][a-z0-9_]*::[a-z][a-z0-9_]*$/.test(body.code)) {
    errors.push(
      "El código debe tener el formato: modulo::accion, solo minúsculas, números y guiones bajos. Ejemplo: user::create."
    );
  }
  // description: obligatorio, string, longitud
  if (!body.description || typeof body.description !== "string") {
    errors.push("La descripción es obligatoria y debe ser texto.");
  } else if (body.description.length < 10 || body.description.length > 100) {
    errors.push("La descripción debe tener entre 10 y 100 caracteres.");
  }
  // root: opcional, booleano
  if (body.root !== undefined && typeof body.root !== "boolean") {
    errors.push("El campo root debe ser verdadero o falso.");
  }
  // created_by: opcional, string
  if (body.created_by !== undefined && typeof body.created_by !== "string") {
    errors.push("El campo created_by debe ser texto.");
  }
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
  return body;
}

module.exports = { validateCreateDto };
