const { withClient } = require("../db");
const {
  ok,
  created,
  noContent,
  badRequest,
  notFound,
  parseJson,
} = require("../http");

// Schema: orus_iam.permission (code TEXT PK, description TEXT, root BOOL)

exports.listPermissions = async () => {
  const data = await withClient(async (c) => {
    const res = await c.query(
      `SELECT code, description, root, created_at, created_at_co, created_by FROM orus_iam.permission ORDER BY code`
    );
    return res.rows;
  });
  return ok({ items: data });
};

exports.getPermission = async (event) => {
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

exports.createPermission = async (event) => {
  const body = parseJson(event);
  const { code, description, root = false, created_by = "system" } = body;
  if (!code || !description)
    return badRequest("code and description are required");
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
    if (e.code === "23505") return badRequest("Permission already exists"); // unique_violation
    return badRequest("Error creating permission", e.message);
  }
};

exports.updatePermission = async (event) => {
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
      `UPDATE orus_iam.permission SET ${fields.join(
        ", "
      )} WHERE code = $${i} RETURNING code, description, root, created_at, created_at_co, created_by`,
      values
    );
    return res.rows[0];
  });
  if (!row) return notFound("Permission not found");
  return ok(row);
};

exports.deletePermission = async (event) => {
  const { code } = event.pathParameters || {};
  if (!code) return badRequest("Missing path parameter: code");
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
