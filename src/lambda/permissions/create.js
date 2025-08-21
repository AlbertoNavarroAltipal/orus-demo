const { withClient } = require("../../config/db");
const { created, badRequest, parseJson } = require("../../config/http");
const { validateCreateDto } = require("./dto/create-dto");

exports.handler = async (event) => {
  const body = parseJson(event);
  // Validación con class-validator y class-transformer
  try {
    validateCreateDto(body);
  } catch (err) {
    // Mensaje de error de validación en español
    return badRequest(
      "Error de validación: los datos enviados no son válidos. Detalles: " +
        err.message
    );
  }
  const { code, description, root = false, created_by = "system" } = body;
  try {
    const row = await withClient(async (c) => {
      const res = await c.query(
        `INSERT INTO orus_iam.permission (code, description, root, created_by) VALUES ($1,$2,$3,$4) RETURNING code, description, root, created_at, created_at_co, created_by`,
        [code, description, root, created_by]
      );
      return res.rows[0];
    });
    return created(row);
  } catch (e) {
    if (e.code === "23505") {
      // Mensaje de error por duplicidad en español
      return badRequest("Ya existe un permiso con ese código.");
    }
    // Mensaje de error genérico en español
    return badRequest(
      "Error al crear el permiso: " + (e.message || "Error desconocido")
    );
  }
};
