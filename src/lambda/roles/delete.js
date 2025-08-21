const { withClient } = require("../db");
const { noContent, badRequest, notFound } = require("../http");

exports.handler = async (event) => {
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
