const { withClient } = require("../db");
const { noContent, badRequest } = require("../http");

exports.handler = async (event) => {
  const { email, roleCode } = event.pathParameters || {};
  if (!email || !roleCode)
    return badRequest("Missing path parameters: email, roleCode");
  try {
    await withClient(async (c) => {
      await c.query("BEGIN");
      const rl = await c.query(
        "SELECT 1 FROM orus_iam.roles WHERE code = $1::bigint",
        [roleCode]
      );
      if (!rl.rowCount) throw new Error("Role not found");
      await c.query(
        `INSERT INTO orus_iam.user_roles (user_email, role_code) VALUES ($1,$2::bigint) ON CONFLICT DO NOTHING`,
        [email, roleCode]
      );
      await c.query("COMMIT");
    });
    return noContent();
  } catch (e) {
    return badRequest(e.message);
  }
};
