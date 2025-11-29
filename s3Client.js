const AWS = require("aws-sdk");

const s3 = new AWS.S3();

const BUCKET_NAME = process.env.BUCKET_NAME || "";
const TODOS_KEY = "todos.json";

async function getTodos() {
  try {
    const res = await s3
      .getObject({ Bucket: BUCKET_NAME, Key: TODOS_KEY })
      .promise();
    return JSON.parse(res.Body.toString());
  } catch (err) {
    // If file doesn't exist yet, just return empty list
    if (err.code === "NoSuchKey") return [];
    throw err;
  }
}

async function saveTodos(todos) {
  await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Key: TODOS_KEY,
      Body: JSON.stringify(todos, null, 2),
      ContentType: "application/json",
    })
    .promise();
}

module.exports = { getTodos, saveTodos };
