const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

// ─── In-Memory Store ─────────────────────────────────────────────────────────
const users = new Map();

// ─── Helpers ─────────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUser(body, requireAll = true) {
  const errors = [];

  if (requireAll || body.name !== undefined) {
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      errors.push("name is required and must be a non-empty string.");
    }
  }

  if (requireAll || body.email !== undefined) {
    if (!body.email || !EMAIL_REGEX.test(body.email)) {
      errors.push("email is required and must be a valid email address.");
    }
  }

  if (requireAll || body.age !== undefined) {
    if (body.age === undefined || body.age === null) {
      errors.push("age is required.");
    } else if (
      typeof body.age !== "number" ||
      !Number.isInteger(body.age) ||
      body.age < 0 ||
      body.age > 150
    ) {
      errors.push("age must be a positive integer between 0 and 150.");
    }
  }

  return errors;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /users — list all users
app.get("/users", (req, res) => {
  const all = Array.from(users.values());
  res.status(200).json({
    success: true,
    count: all.length,
    data: all,
  });
});

// GET /users/:id — get a single user
app.get("/users/:id", (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User with id '${req.params.id}' not found.`,
    });
  }
  res.status(200).json({ success: true, data: user });
});

// POST /users — create a user
app.post("/users", (req, res) => {
  const errors = validateUser(req.body, true);
  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  // Check for duplicate email
  const duplicate = Array.from(users.values()).find(
    (u) => u.email.toLowerCase() === req.body.email.toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: "A user with this email already exists.",
    });
  }

  const newUser = {
    id: uuidv4(),
    name: req.body.name.trim(),
    email: req.body.email.toLowerCase().trim(),
    age: req.body.age,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.set(newUser.id, newUser);
  res.status(201).json({ success: true, data: newUser });
});

// PUT /users/:id — full update (all fields required)
app.put("/users/:id", (req, res) => {
  if (!users.has(req.params.id)) {
    return res.status(404).json({
      success: false,
      message: `User with id '${req.params.id}' not found.`,
    });
  }

  const errors = validateUser(req.body, true);
  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  // Check duplicate email (excluding this user)
  const duplicate = Array.from(users.values()).find(
    (u) =>
      u.email.toLowerCase() === req.body.email.toLowerCase() &&
      u.id !== req.params.id
  );
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: "Another user with this email already exists.",
    });
  }

  const updated = {
    ...users.get(req.params.id),
    name: req.body.name.trim(),
    email: req.body.email.toLowerCase().trim(),
    age: req.body.age,
    updatedAt: new Date().toISOString(),
  };

  users.set(req.params.id, updated);
  res.status(200).json({ success: true, data: updated });
});

// PATCH /users/:id — partial update (any subset of fields)
app.patch("/users/:id", (req, res) => {
  if (!users.has(req.params.id)) {
    return res.status(404).json({
      success: false,
      message: `User with id '${req.params.id}' not found.`,
    });
  }

  const errors = validateUser(req.body, false);
  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  if (req.body.email) {
    const duplicate = Array.from(users.values()).find(
      (u) =>
        u.email.toLowerCase() === req.body.email.toLowerCase() &&
        u.id !== req.params.id
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Another user with this email already exists.",
      });
    }
  }

  const existing = users.get(req.params.id);
  const updated = {
    ...existing,
    ...(req.body.name && { name: req.body.name.trim() }),
    ...(req.body.email && { email: req.body.email.toLowerCase().trim() }),
    ...(req.body.age !== undefined && { age: req.body.age }),
    updatedAt: new Date().toISOString(),
  };

  users.set(req.params.id, updated);
  res.status(200).json({ success: true, data: updated });
});

// DELETE /users/:id — delete a user
app.delete("/users/:id", (req, res) => {
  if (!users.has(req.params.id)) {
    return res.status(404).json({
      success: false,
      message: `User with id '${req.params.id}' not found.`,
    });
  }

  users.delete(req.params.id);
  res.status(200).json({
    success: true,
    message: `User '${req.params.id}' deleted successfully.`,
  });
});

// ─── 404 & Error Handlers ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error." });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅  Users API running at http://localhost:${PORT}`);
});

module.exports = app;
