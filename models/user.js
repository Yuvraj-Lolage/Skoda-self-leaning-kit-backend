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

  static async create({ name, email, password, role }) {
    const connection = await db.getConnection();

    const DEFAULT_TOURS = {
      training: 0,
      dashboard: 0,
      submodule: 0,
      assessment: 0,
      adminDashboard: 0
    };

    try {
      await connection.beginTransaction();

      // 1️⃣ Insert user
      const userSql = `
      INSERT INTO users (
        name,
        email,
        password,
        role,
        first_visit_welcome,
        first_visit_driver,
        xp,
        tours
      )
      VALUES (?, ?, ?, ?, 0, 0, 0, ?)
    `;

      const userValues = [
        name,
        email,
        password,
        role || "User",
        JSON.stringify(DEFAULT_TOURS)
      ];

      const [userResult] = await connection.execute(userSql, userValues);
      const userId = userResult.insertId;

      // 2️⃣ Insert default progress (Module 1, Submodule 1 in progress)
      const progressSql = `
      INSERT INTO user_progress (
        user_id,
        module_id,
        completed_modules,
        completed_submodules,
        current_submodule_id,
        next_submodule_id,
        last_accessed
      )
      VALUES (?, 1, NULL, JSON_ARRAY(), 1, 2, NOW())
    `;

      await connection.execute(progressSql, [userId]);

      // 3️⃣ Commit everything
      await connection.commit();

      return userId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async userExists(email) {
    const sql = `
    SELECT 1
    FROM users
    WHERE email = ?
    LIMIT 1
  `;

    const [rows] = await db.execute(sql, [email]);
    return rows.length > 0;
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
    const { id, name, email: userEmail, password, role, first_visit_welcome, first_visit_driver, xp } = rows[0];
    return new User(id, name, userEmail, password, role, first_visit_welcome, first_visit_driver, xp);
  }

  static async findAll() {
    const [rows] = await db.query("SELECT * FROM users");
    return rows.map((row) => new User(row.id, row.name, row.email, row.password, row.role, row.first_visit_welcome, row.first_visit_driver, row.xp));
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
