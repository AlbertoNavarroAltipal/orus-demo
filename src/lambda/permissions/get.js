const { withClient } = require("../../config/db");
const { ok, badRequest, notFound } = require("../../config/http");

exports.handler = async (event) => {
  const { code } = event.pathParameters || {};
  if (!code) return badRequest("Missing path parameter: code");
  const row = await withClient(async (c) => {
    const res = await c.query(
      `SELECT code, description, root, created_at, created_at_co, created_by FROM orus_iam.permission WHERE code = $1`,
      [code]
    );
    return res.rows[0];
  });
  if (!row) return notFound("Permission not found");
  return ok(row);
};
