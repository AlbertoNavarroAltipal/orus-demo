const { withClient } = require("../db");
const { noContent, badRequest } = require("../http");

exports.handler = async (event) => {
  const { email, permissionCode } = event.pathParameters || {};
  if (!email || !permissionCode)
    return badRequest("Missing path parameters: email, permissionCode");
  try {
    await withClient(async (c) => {
      await c.query("BEGIN");
      const perm = await c.query(
        "SELECT 1 FROM orus_iam.permission WHERE code = $1",
        [permissionCode]
      );
      if (!perm.rowCount) throw new Error("Permission not found");
      await c.query(
        `INSERT INTO orus_iam.user_permissions (user_email, permission_code) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [email, permissionCode]
      );
      await c.query("COMMIT");
    });
    return noContent();
  } catch (e) {
    return badRequest(e.message);
  }
};
