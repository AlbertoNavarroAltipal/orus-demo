const { withClient } = require("../db");
const { noContent, badRequest, notFound } = require("../http");

exports.handler = async (event) => {
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
