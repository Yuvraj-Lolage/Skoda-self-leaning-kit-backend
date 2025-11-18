const db = require("../config/db");

class User {
  constructor(id, name, email, password, first_visit_welcome, first_visit_driver) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.first_visit_welcome = first_visit_welcome;
    this.first_visit_driver = first_visit_driver;
  }

  static async create(name, email, password) {
    const [result] = await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, password]
    );
    return new User(result.insertId, name, email, password);
  }

  static async findById(id) {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) return null;
    const { id: userId, name, email, password, first_visit_welcome, first_visit_driver } = rows[0];
    return new User(userId, name, email, password, first_visit_welcome, first_visit_driver);
  }

  static async findByEmail(email) {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return null;
    const { id, name, email: userEmail, password, first_visit_welcome, first_visit_driver} = rows[0];
    return new User(id, name, userEmail, password, first_visit_welcome, first_visit_driver);
  }

  static async findAll() {
    const [rows] = await db.query("SELECT * FROM users");
    return rows.map((row) => new User(row.id, row.name, row.email, row.password, first_visit_welcome, first_visit_driver));
  }

  async update() {
    await db.query(
      "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?",
      [this.name, this.email, this.password, this.id]
    );
    return this;
  }

  async delete() {
    await db.query("DELETE FROM users WHERE id = ?", [this.id]);
    return true;
  }
}

module.exports = { User };
