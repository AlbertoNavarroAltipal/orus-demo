const { withClient } = require("../db");
const { noContent, badRequest } = require("../http");

exports.handler = async (event) => {
  const { code, permissionCode } = event.pathParameters || {};
  if (!code || !permissionCode)
    return badRequest("Missing path parameters: code, permissionCode");
  try {
    await withClient(async (c) => {
      await c.query("BEGIN");
      const role = await c.query(
        "SELECT 1 FROM orus_iam.roles WHERE code = $1::bigint",
        [code]
      );
      if (!role.rowCount) throw new Error("Role not found");
      const perm = await c.query(
        "SELECT 1 FROM orus_iam.permission WHERE code = $1",
        [permissionCode]
      );
      if (!perm.rowCount) throw new Error("Permission not found");
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
