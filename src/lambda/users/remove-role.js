const { withClient } = require("../db");
const { noContent, badRequest, notFound } = require("../http");

exports.handler = async (event) => {
  const { email, roleCode } = event.pathParameters || {};
  if (!email || !roleCode)
    return badRequest("Missing path parameters: email, roleCode");
  const count = await withClient(async (c) => {
    const res = await c.query(
      `DELETE FROM orus_iam.user_roles WHERE user_email = $1 AND role_code = $2::bigint`,
      [email, roleCode]
    );
    return res.rowCount;
  });
  if (!count) return notFound("User role mapping not found");
  return noContent();
};
