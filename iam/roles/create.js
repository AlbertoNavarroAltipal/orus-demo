const { withClient } = require("../db");
const { created, badRequest, parseJson } = require("../http");

exports.handler = async (event) => {
  const body = parseJson(event);
  const { description, root = false, created_by = "system" } = body;
  if (!description) return badRequest("description is required");
  try {
    const row = await withClient(async (c) => {
      const res = await c.query(
        `INSERT INTO orus_iam.roles (description, root, created_by) VALUES ($1,$2,$3) RETURNING code, description, root, created_at, created_at_co, created_by`,
        [description, root, created_by]
      );
      return res.rows[0];
    });
    return created(row);
  } catch (e) {
    return badRequest("Error creating role", e.message);
  }
};
