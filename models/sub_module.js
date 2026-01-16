const db = require("../config/db");

class SubModule {
  static async getSubModuleWithId(id) {
    const [rows] = await db.query(`select * from submodules where submodule_id = 1;`);

    const modulesMap = {};
    return rows[0];
  };

  static async getSubModuleInModuleWithId(moduleId, submoduleId) {
    const [rows] = await db.query(`select * from submodules where module_id = ${moduleId} and  submodule_id = ${submoduleId};`);
    return rows[0];
  };

  static async getSubMoudulesInModule(module_id) {
    const [rows] = await db.query(`select * from submodules where module_id = ${module_id} ORDER BY order_index;`);
    return rows;
  };

  static async shiftSubmoduleContentUrls(moduleId, fromIndex) {
  const [rows] = await db.query(
    `
    SELECT submodule_id, order_index, content_url
    FROM submodules
    WHERE module_id = ?
      AND order_index >= ?
      AND content_url IS NOT NULL
    ORDER BY order_index DESC
    `,
    [moduleId, fromIndex]
  );

  for (const row of rows) {
    if (!row.content_url) continue;

    const oldIndex = row.order_index;
    const newIndex = oldIndex + 1;

    // ✅ FIX 2: safe, strict replace
    const updatedUrl = row.content_url.replace(
      new RegExp(`(/submodule_)${oldIndex}(/)`, "i"),
      `$1${newIndex}$2`
    );

    await db.query(
      `
      UPDATE submodules
      SET content_url = ?
      WHERE submodule_id = ?
      `,
      [updatedUrl, row.submodule_id]
    );
  }
}



  static async createSubModule({
    module_id,
    submodule_name,
    submodule_description,
    file_type,
    order_index,
    duration,
    video_path
  }) {
    const [result] = await db.execute(
      `INSERT INTO submodules
       (module_id, name, description, content_type, content_url ,order_index, duration)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [module_id, submodule_name, submodule_description, file_type, video_path, order_index, duration]
    );
    return {
      submodule_id: result.insertId,
      module_id,
      submodule_name,
      submodule_description,
      order_index,
      duration
    };
  }

  static async getMaxOrderIndex(module_id) {
    const [rows] = await db.execute(
      `SELECT MAX(order_index) AS max_order_index
       FROM submodules
       WHERE module_id = ?`,
      [module_id]
    );
    return rows[0].max_order_index || -1;
  }

  static async shiftSubmoduleOrders(module_id, order_index) {
    const [result] = await db.execute(
      `UPDATE submodules
       SET order_index = order_index + 1
       WHERE module_id = ? AND order_index >= ?`,
      [module_id, order_index]
    );
    return result.affectedRows;
  }
}



module.exports = { SubModule };