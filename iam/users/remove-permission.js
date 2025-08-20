const { withClient } = require("../db");
const { noContent, badRequest, notFound } = require("../http");

exports.handler = async (event) => {
  const { email, permissionCode } = event.pathParameters || {};
  if (!email || !permissionCode)
    return badRequest("Missing path parameters: email, permissionCode");
  const count = await withClient(async (c) => {
    const res = await c.query(
      `DELETE FROM orus_iam.user_permissions WHERE user_email = $1 AND permission_code = $2`,
      [email, permissionCode]
    );
    return res.rowCount;
  });
  if (!count) return notFound("User permission mapping not found");
  return noContent();
};
