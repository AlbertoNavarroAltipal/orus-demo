const { withClient } = require("../db");
const { ok, badRequest, notFound, parseJson } = require("../http");

exports.handler = async (event) => {
  const { code } = event.pathParameters || {};
  if (!code) return badRequest("Missing path parameter: code");
  const body = parseJson(event);
  const fields = [];
  const values = [];
  let i = 1;
  if (body.description !== undefined) {
    fields.push(`description = $${i++}`);
    values.push(body.description);
  }
  if (body.root !== undefined) {
    fields.push(`root = $${i++}`);
    values.push(body.root);
  }
  if (fields.length === 0) return badRequest("No updatable fields provided");
  values.push(code);
  const row = await withClient(async (c) => {
    const res = await c.query(
      `UPDATE orus_iam.roles SET ${fields.join(
        ", "
      )} WHERE code = $${i}::bigint RETURNING code, description, root, created_at, created_at_co, created_by`,
      values
    );
    return res.rows[0];
  });
  if (!row) return notFound("Role not found");
  return ok(row);
};
