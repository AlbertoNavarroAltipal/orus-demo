const { withClient } = require("../db");
const {
  ok,
  created,
  noContent,
  badRequest,
  notFound,
  parseJson,
} = require("../http");

// Schema: orus_iam.roles (code BIGSERIAL, description TEXT, root BOOL)

exports.listRoles = async () => {
  const data = await withClient(async (c) => {
    const res = await c.query(
      `SELECT code, description, root, created_at, created_at_co, created_by FROM orus_iam.roles ORDER BY code`
    );
    return res.rows;
  });
  return ok({ items: data });
};

exports.getRole = async (event) => {
  const { code } = event.pathParameters || {};
  if (!code) return badRequest("Missing path parameter: code");
  const row = await withClient(async (c) => {
    const res = await c.query(
      `SELECT code, description, root, created_at, created_at_co, created_by FROM orus_iam.roles WHERE code = $1::bigint`,
      [code]
    );
    return res.rows[0];
  });
  if (!row) return notFound("Role not found");
  return ok(row);
};

exports.createRole = async (event) => {
  const body = parseJson(event);
  const { description, root = false, created_by = "system" } = body;
  if (!description) return badRequest("description is required");
  try {
    const row = await withClient(async (c) => {
      const res = await c.query(
        `INSERT INTO orus_iam.roles (description, root, created_by) VALUES ($1,$2,$3) RETURNING code, description, root, created_at, created_at_co, created_by`,
        [description, root, created_by]
      );
      return res.rows[0];
    });
    return created(row);
  } catch (e) {
    return badRequest("Error creating role", e.message);
  }
};

exports.updateRole = async (event) => {
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

exports.deleteRole = async (event) => {
  const { code } = event.pathParameters || {};
  if (!code) return badRequest("Missing path parameter: code");
  const result = await withClient(async (c) => {
    const res = await c.query(
      `DELETE FROM orus_iam.roles WHERE code = $1::bigint`,
      [code]
    );
    return res.rowCount;
  });
  if (result === 0) return notFound("Role not found");
  return noContent();
};

// Role <-> Permission mapping handlers
exports.listRolePermissions = async (event) => {
  const { code } = event.pathParameters || {};
  if (!code) return badRequest("Missing path parameter: code");
  const items = await withClient(async (c) => {
    const res = await c.query(
      `SELECT rp.permission_code AS code, p.description, p.root
       FROM orus_iam.role_permission rp
       JOIN orus_iam.permission p ON p.code = rp.permission_code
       WHERE rp.role_code = $1::bigint
       ORDER BY rp.permission_code`,
      [code]
    );
    return res.rows;
  });
  return ok({ items });
};

exports.attachPermissionToRole = async (event) => {
  const { code, permissionCode } = event.pathParameters || {};
  if (!code || !permissionCode)
    return badRequest("Missing path parameters: code, permissionCode");
  try {
    await withClient(async (c) => {
      await c.query("BEGIN");
      // Ensure role exists
      const role = await c.query(
        "SELECT 1 FROM orus_iam.roles WHERE code = $1::bigint",
        [code]
      );
      if (!role.rowCount) throw new Error("Role not found");
      // Ensure permission exists
      const perm = await c.query(
        "SELECT 1 FROM orus_iam.permission WHERE code = $1",
        [permissionCode]
      );
      if (!perm.rowCount) throw new Error("Permission not found");
      // Insert mapping
      await c.query(
        `INSERT INTO orus_iam.role_permission (role_code, permission_code) VALUES ($1::bigint,$2) ON CONFLICT DO NOTHING`,
        [code, permissionCode]
      );
      await c.query("COMMIT");
    });
    return noContent();
  } catch (e) {
    return badRequest(e.message);
  }
};

exports.detachPermissionFromRole = async (event) => {
  const { code, permissionCode } = event.pathParameters || {};
  if (!code || !permissionCode)
    return badRequest("Missing path parameters: code, permissionCode");
  const result = await withClient(async (c) => {
    const res = await c.query(
      `DELETE FROM orus_iam.role_permission WHERE role_code = $1::bigint AND permission_code = $2`,
      [code, permissionCode]
    );
    return res.rowCount;
  });
  if (!result) return notFound("Mapping not found");
  return noContent();
};
