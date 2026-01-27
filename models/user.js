const db = require("../config/db");

class User {
  constructor(id, name, email, password, role, first_visit_welcome, first_visit_driver, xp) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
    this.first_visit_welcome = first_visit_welcome;
    this.first_visit_driver = first_visit_driver;
    this.xp = xp;
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
    const { id: userId, name, email, password, role, first_visit_welcome, first_visit_driver, xp } = rows[0];
    return new User(userId, name, email, password, role, first_visit_welcome, first_visit_driver, xp);
  }

  static async findByEmail(email) {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return null;
    const { id, name, email: userEmail, password, role, first_visit_welcome, first_visit_driver } = rows[0];
    return new User(id, name, userEmail, password, role, first_visit_welcome, first_visit_driver);
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

  static async markWelcomeVisited(userId) {
    try {
      await db.query(
        "UPDATE users SET first_visit_welcome = ? WHERE id = ?",
        [true, userId]
      );

      this.first_visit_welcome = true;
      return this;
    } catch (error) {
      console.error("Failed to update welcome visit flag:", error);
      throw new Error("Unable to mark welcome screen as visited");
    }
  }

  static async getUserToursByUserId(userId) {
    try {
      const [rows] = await db.query(
        "SELECT tours FROM users WHERE id = ?",
        [userId]
      );
      return rows[0]?.tours;
    } catch (error) {
      console.error("Failed to update welcome visit flag:", error);
      throw new Error("Unable to mark welcome screen as visited");
    }
  }

  static async updateToursByUserId(userId, tours) {
    try {
      await db.query(
        "UPDATE users SET tours = ? WHERE id = ?",
        [JSON.stringify(tours), userId]
      );
      return true;
    } catch (error) {
      console.error("Failed to update welcome visit flag:", error);
      throw new Error("Unable to mark welcome screen as visited");
    }
  }
  async delete() {
    await db.query("DELETE FROM users WHERE id = ?", [this.id]);
    return true;
  }

  // Inside your User model file
  static async updateXP(userId, xpEarned) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE users SET xp = xp + ? WHERE id = ?";
      db.query(sql, [xpEarned, userId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
}

module.exports = { User };
