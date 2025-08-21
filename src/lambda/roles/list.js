const { withClient } = require("../db");
const { ok } = require("../http");

exports.handler = async () => {
  const data = await withClient(async (c) => {
    const res = await c.query(
      `SELECT code, description, root, created_at, created_at_co, created_by FROM orus_iam.roles ORDER BY code`
    );
    return res.rows;
  });
  return ok({ items: data });
};
