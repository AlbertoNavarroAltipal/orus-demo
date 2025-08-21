const { withClient } = require("../db");
const { ok } = require("../http");
const crypto = require("crypto");

/**
 * Respuesta estandar solicitada:
 * {
 *   data: [...],
 *   meta: { page, per_page, total, total_pages, has_next, has_prev, sort: [...], filters: {...}, facets: {...}, summary: {...}, request_id, duration_ms },
 *   links: { self, first, prev, next, last }
 * }
 */

exports.handler = async (event = {}) => {
  const start = Date.now();
  const qs = event.queryStringParameters || {};

  // Parse paginación
  const page = Math.max(1, parseInt(qs.page, 10) || 1);
  const perPage = Math.min(500, Math.max(1, parseInt(qs.per_page, 10) || 25));

  // Parse orden: sort=-field1,field2  => [{field: 'field1', direction:'desc'}, {field:'field2',direction:'asc'}]
  const sortRaw = qs.sort || "code"; // por defecto code asc
  const sort = sortRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({
      field: s.replace(/^-/, ""),
      direction: s.startsWith("-") ? "desc" : "asc",
      nulls: "last",
    }));

  // Construir ORDER BY seguro (whitelist de columnas permitidas)
  const allowedSort = new Set([
    "code",
    "description",
    "root",
    "created_at",
    "created_by",
  ]);
  const orderBy =
    sort
      .filter((s) => allowedSort.has(s.field))
      .map((s) => `${s.field} ${s.direction.toUpperCase()}`)
      .join(", ") || "code ASC";

  // Filtros simples (ejemplo): filter_code (ilike substring), filter_root (true/false)
  const filters = [];
  const values = [];
  let idx = 1;

  // Filtro tipo IN: filter_code=in(admin,gestor,super)
  if (qs.filter_code) {
    const inMatch = String(qs.filter_code).match(/^in\(([^)]+)\)$/);
    if (inMatch) {
      const arr = inMatch[1]
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      if (arr.length) {
        filters.push(`code IN (${arr.map(() => `$${idx++}`).join(",")})`);
        values.push(...arr);
      }
    } else {
      filters.push(`code ILIKE $${idx++}`);
      values.push(`%${qs.filter_code}%`);
    }
  }

  // Filtro tipo IN para description
  if (qs.filter_description) {
    const inMatch = String(qs.filter_description).match(/^in\(([^)]+)\)$/);
    if (inMatch) {
      const arr = inMatch[1]
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      if (arr.length) {
        filters.push(
          `description IN (${arr.map(() => `$${idx++}`).join(",")})`
        );
        values.push(...arr);
      }
    } else {
      filters.push(`description ILIKE $${idx++}`);
      values.push(`%${qs.filter_description}%`);
    }
  }

  if (qs.filter_root === "true" || qs.filter_root === "false") {
    filters.push(`root = $${idx++}`);
    values.push(qs.filter_root === "true");
  }

  // Filtros anidados OR: filter_or=[{"field":"code","op":"in","value":["admin","gestor"]},{"field":"description","op":"contains","value":"acceso"}]
  if (qs.filter_or) {
    try {
      const arr =
        typeof qs.filter_or === "string"
          ? JSON.parse(qs.filter_or)
          : qs.filter_or;
      if (Array.isArray(arr) && arr.length) {
        const orClauses = arr
          .map((f) => {
            if (f.op === "in" && Array.isArray(f.value)) {
              const field = f.field;
              const vals = f.value;
              const clause = `${field} IN (${vals
                .map(() => `$${idx++}`)
                .join(",")})`;
              values.push(...vals);
              return clause;
            } else if (f.op === "contains") {
              const field = f.field;
              values.push(`%${f.value}%`);
              return `${field} ILIKE $${idx++}`;
            } else if (f.op === "eq") {
              const field = f.field;
              values.push(f.value);
              return `${field} = $${idx++}`;
            }
            // Otros operadores se pueden agregar aquí
          })
          .filter(Boolean);
        if (orClauses.length) {
          filters.push(`(${orClauses.join(" OR ")})`);
        }
      }
    } catch (e) {
      // Si el JSON está mal formado, ignorar el filtro OR
    }
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  // Total antes de paginar
  const baseQuery = `FROM orus_iam.permission ${whereClause}`;

  const { total, rows } = await withClient(async (c) => {
    const totalRes = await c.query(
      `SELECT COUNT(*) AS count ${baseQuery}`,
      values
    );
    const total = parseInt(totalRes.rows[0].count, 10);
    const offset = (page - 1) * perPage;
    const dataRes = await c.query(
      `SELECT code, description, root, created_at, created_at_co, created_by ${baseQuery} ORDER BY ${orderBy} LIMIT $${idx} OFFSET $${
        idx + 1
      }`,
      [...values, perPage, offset]
    );
    return { total, rows: dataRes.rows };
  });

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Transformación de data -> id etc.
  const data = rows.map((r) => ({
    id: r.code,
    code: r.code,
    description: r.description,
    root: r.root,
    created_at: r.created_at,
    created_at_co: r.created_at_co,
    created_by: r.created_by,
  }));

  // Facets ejemplo: distribución de root
  // Ejecutar conteo root true/false solo si hay resultados
  let facets = {};
  if (total > 0) {
    // Nota: podría reusar conexión, pero simplicidad ante bajo costo
    const facetData = await withClient(async (c) => {
      const f = await c.query(
        `SELECT root::text AS value, COUNT(*) AS count ${baseQuery} GROUP BY root`,
        values
      );
      return f.rows.map((row) => ({
        value: row.value === "true",
        count: parseInt(row.count, 10),
      }));
    });
    facets = { root: facetData };
  }

  // Summary simple
  const summary = {
    total_permissions: total,
    root_true: facets.root
      ? facets.root.find((x) => x.value === true)?.count || 0
      : 0,
    root_false: facets.root
      ? facets.root.find((x) => x.value === false)?.count || 0
      : 0,
  };

  // Reconstruir enlaces
  const basePath =
    (event.requestContext &&
      (event.requestContext.resourcePath || event.requestContext.path)) ||
    "/permissions";
  const buildQuery = (overrides = {}) => {
    const params = { ...qs, ...overrides, page: overrides.page };
    return Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
  };
  const selfQuery = buildQuery({ page });
  const firstQuery = buildQuery({ page: 1 });
  const prevQuery = hasPrev ? buildQuery({ page: page - 1 }) : null;
  const nextQuery = hasNext ? buildQuery({ page: page + 1 }) : null;
  const lastQuery = buildQuery({ page: totalPages });

  const links = {
    self: `${basePath}?${selfQuery}`,
    first: `${basePath}?${firstQuery}`,
    prev: prevQuery ? `${basePath}?${prevQuery}` : null,
    next: nextQuery ? `${basePath}?${nextQuery}` : null,
    last: `${basePath}?${lastQuery}`,
  };

  const durationMs = Date.now() - start;

  const response = {
    data,
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: totalPages,
      has_next: hasNext,
      has_prev: hasPrev,
      sort: sort.map((s) => ({
        field: s.field,
        direction: s.direction,
        nulls: s.nulls,
      })),
      filters: {
        // Representación AND simple de filtros aplicados
        and: [
          ...(qs.filter_code
            ? [{ field: "code", op: "contains", value: qs.filter_code }]
            : []),
          ...(qs.filter_description
            ? [
                {
                  field: "description",
                  op: "contains",
                  value: qs.filter_description,
                },
              ]
            : []),
          ...(qs.filter_root === "true" || qs.filter_root === "false"
            ? [{ field: "root", op: "eq", value: qs.filter_root === "true" }]
            : []),
        ],
      },
      facets,
      summary,
      request_id:
        (event.requestContext && event.requestContext.requestId) ||
        crypto.randomUUID(),
      duration_ms: durationMs,
    },
    links,
  };

  return ok(response);
};
