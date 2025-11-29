const { getTodos, saveTodos } = require("./s3Client");

const TODOS_BASE_PATH = "/todos";

function extractId(path) {
  // gets whatever comes after "/todos/"
  return path.slice(TODOS_BASE_PATH.length + 1);
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = event.path;
  const body = event.body ? JSON.parse(event.body) : null;

  try {
    // GET /todos  -> list all
    if (path === TODOS_BASE_PATH && method === "GET") {
      const todos = await getTodos();
      return response(200, todos);
    }

    // POST /todos -> create new
    if (path === TODOS_BASE_PATH && method === "POST") {
      if (!body || !body.title) {
        return response(400, { error: "Missing 'title' field" });
      }

      const todos = await getTodos();
      const newTodo = {
        id: Date.now().toString(),
        title: body.title,
        done: false,
      };

      todos.push(newTodo);
      await saveTodos(todos);
      return response(201, newTodo);
    }

    // All routes that are /todos/:id
    if (path.startsWith(TODOS_BASE_PATH + "/")) {
      const id = extractId(path);
      const todos = await getTodos();

      // GET /todos/:id -> get single
      if (method === "GET") {
        const todo = todos.find((t) => t.id === id);
        return todo
          ? response(200, todo)
          : response(404, { error: "Todo not found" });
      }

      // PUT /todos/:id -> update
      if (method === "PUT") {
        const idx = todos.findIndex((t) => t.id === id);
        if (idx === -1) {
          return response(404, { error: "Todo not found" });
        }

        todos[idx] = { ...todos[idx], ...body };
        await saveTodos(todos);
        return response(200, todos[idx]);
      }

      // DELETE /todos/:id -> delete
      if (method === "DELETE") {
        const before = todos.length;
        const filtered = todos.filter((t) => t.id !== id);

        if (filtered.length === before) {
          return response(404, { error: "Todo not found" });
        }

        await saveTodos(filtered);
        return response(200, { message: "Deleted" });
      }
    }

    // No route matched
    return response(404, { error: "Not Found" });
  } catch (err) {
    console.error(err);
    return response(500, { error: "Internal Server Error" });
  }
};
