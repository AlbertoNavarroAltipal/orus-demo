const { withClient } = require("../db");
const { ok, badRequest } = require("../http");

exports.handler = async (event) => {
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
