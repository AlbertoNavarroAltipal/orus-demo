function response(statusCode, body, headers) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

function badRequest(message, details) {
  return response(400, { message, details });
}

function notFound(message) {
  return response(404, { message });
}

function ok(body) {
  return response(200, body);
}

function created(body) {
  return response(201, body);
}

function noContent() {
  return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
}

function parseJson(event) {
  try {
    return event && event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    throw new Error("Invalid JSON body");
  }
}

module.exports = {
  response,
  badRequest,
  notFound,
  ok,
  created,
  noContent,
  parseJson,
};
