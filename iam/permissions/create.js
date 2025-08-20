const { withClient } = require("../db");
const { created, badRequest, parseJson } = require("../http");

exports.handler = async (event) => {
  const body = parseJson(event);
  const { code, description, root = false, created_by = "system" } = body;
  if (!code || !description)
    return badRequest("code and description are required");
  try {
    const row = await withClient(async (c) => {
      const res = await c.query(
        `INSERT INTO orus_iam.permission (code, description, root, created_by) VALUES ($1,$2,$3,$4) RETURNING code, description, root, created_at, created_at_co, created_by`,
        [code, description, root, created_by]
      );
      return res.rows[0];
    });
    return created(row);
  } catch (e) {
    if (e.code === "23505") return badRequest("Permission already exists");
    return badRequest("Error creating permission", e.message);
  }
};
