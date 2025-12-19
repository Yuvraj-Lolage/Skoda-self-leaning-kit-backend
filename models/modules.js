const db = require("../config/db");
const fs = require("fs");
const path = require("path");


class Modules {

  Modules() { }

  // static async getAllModules() {
  //   const query = `
  //     SELECT * FROM modules ORDER BY order_index;
  //   `;
  //   try {
  //     const [rows] = await db.query(query);
  //     return rows;
  //   } catch (error) {
  //     console.error("Error in getAllModulesWithSubmodulesRaw:", error);
  //     throw error;
  //   }
  // }

  static async getAllModulesWithSubmodulesRaw() {
    const query = `
      SELECT 
        m.module_id,
        m.name as module_name,
        m.description,
        s.submodule_id,
        s.name,
        s.description,
        s.content_url,
        s.order_index,
        s.duration,
        s.created_at
      FROM modules AS m
      LEFT JOIN submodules AS s ON s.module_id = m.module_id
      ORDER BY m.module_id, s.order_index;
    `;

    try {
      const [rows] = await db.query(query);
      return rows; // flat list of modules + submodules
    } catch (error) {
      console.error("Error in getAllModulesWithSubmodulesRaw:", error);
      throw error;
    }
  }

  static async getAllModulesWithSubmodulesOld() {
    const [rows] = await db.query(`
    SELECT 
      m.module_id,
      m.name AS module_name,
      m.description AS module_description,
      s.submodule_id,
      s.name AS submodule_name,
      s.description AS submodule_description,
      s.content_url,
      s.order_index,
      s.duration
    FROM Modules m
    LEFT JOIN Submodules s ON m.module_id = s.module_id
    ORDER BY m.module_id, s.order_index
  `);

    const modulesMap = {};

    rows.forEach(row => {
      if (!modulesMap[row.module_id]) {
        modulesMap[row.module_id] = {
          module_id: row.module_id,
          module_name: row.module_name,
          module_description: row.module_description,
          submodules: [],
        };
      }

      if (row.submodule_id) {
        modulesMap[row.module_id].submodules.push({
          submodule_id: row.submodule_id,
          submodule_name: row.submodule_name,
          submodule_description: row.submodule_description,
          content_url: row.content_url,
          order_index: row.order_index,
          duration: row.duration,
        });
      }
    });

    return Object.values(modulesMap);
  };


  static async getAllModulesWithSubmodules() {
    const [modules] = await db.execute(`SELECT * FROM modules`);
    const [submodules] = await db.execute(`SELECT * FROM submodules`);

    // Group submodules by module_id
    const grouped = modules.map((m) => ({
      module_id: m.module_id,
      module_name: m.module_name,
      module_description: m.module_description,
      submodules: submodules
        .filter((s) => s.module_id === m.module_id)
        .map((s) => ({
          submodule_id: s.submodule_id,
          submodule_name: s.submodule_name,
          submodule_description: s.submodule_description,
        })),
    }));

    return grouped;
  }

  static async getModuleWithSubmodules(moduleId) {
    // Get module by ID
    const [modules] = await db.execute(
      `SELECT * FROM modules WHERE module_id = ?`,
      [moduleId]
    );

    // If module not found
    if (!modules || modules.length === 0) {
      return null; // or return {}, depending on your preference
    }

    const module = modules[0];

    // Get submodules for this module
    const [submodules] = await db.execute(
      `SELECT * FROM submodules WHERE module_id = ? ORDER BY order_index ASC`,
      [moduleId]
    );

    return {
      module_id: module.module_id,
      module_name: module.name,
      module_description: module.description,
      submodules: submodules.map((s) => ({
        submodule_id: s.submodule_id,
        submodule_name: s.name,
        submodule_description: s.description,
        order_index: s.order_index,
        content_url: s.content_url,
        duration: s.duration,
        created_at: s.created_at,
      })),
    };
  }

  static async getAllModules() {
    const [modules] = await db.execute(`
        SELECT 
        module_id,
        name AS module_name,
        description AS module_description,
        order_index,
        duration,
        created_at
      FROM modules
      ORDER BY order_index;`);
    return modules;
  }

  static async createModule({ module_name, module_description, order_index, duration }) {
    const [result] = await db.execute(
      `INSERT INTO modules (name, description, order_index, duration) VALUES (?, ?, ?, ?)`,
      [module_name, module_description, order_index, duration]
    );
    return {
      module_id: result.insertId,
      module_name,
      module_description,
      order_index,
      duration
    };
  }

  static async getMaxOrderIndex() {
    const [rows] = await db.execute(`SELECT MAX(order_index) AS max_order_index FROM modules`);
    return rows[0].max_order_index || -1;
  }

  static async shiftModuleOrders(order_index) {
    const [result] = await db.execute(
      `UPDATE modules
      SET order_index = order_index + 1
      WHERE order_index >= ?
      ORDER BY order_index DESC`,
      [order_index]
    );
    return result.affectedRows;
  }
}


module.exports = {
  Modules
}