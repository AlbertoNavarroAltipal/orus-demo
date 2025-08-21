const { withClient } = require("../../config/db");
const { noContent, badRequest, notFound } = require("../../config/http");
const { validateDeleteDto } = require("./dto/delete-dto");

exports.handler = async (event) => {
  const { code } = event.pathParameters || {};
  // Validación con class-validator y class-transformer
  try {
    validateDeleteDto({ code });
  } catch (err) {
    return badRequest(err.message);
  }
  const result = await withClient(async (c) => {
    const res = await c.query(
      `DELETE FROM orus_iam.permission WHERE code = $1`,
      [code]
    );
    return res.rowCount;
  });
  if (result === 0) return notFound("Permission not found");
  return noContent();
};
