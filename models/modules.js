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
        s.content_type,
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
          content_type: row.content_type,
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


  static async getAllModulesWithSubmodulesStatus(userId) {
    //   const sql = `
    //     SELECT JSON_OBJECT(
    // 'total_completed_modules', COALESCE(SUM(t.module_completed), 0),
    // 'modules',
    //   JSON_ARRAYAGG(
    //     JSON_OBJECT(
    //       'module_id', t.module_id,
    //       'module_name', t.module_name,
    //       'module_order_index', t.module_order_index,
    //       'status', t.module_completed,
    //       'current_module_id', t.current_module_id,
    //       'current_submodule_id', t.current_submodule_id,
    //       'submodules', t.submodules
    //         )
    //       )
    //     ) AS result
    //     FROM (
    //       SELECT
    //         m.module_id,
    //         m.name AS module_name,
    //         m.order_index AS module_order_index,

    //         CASE
    //           WHEN COUNT(sm.submodule_id) = 0 THEN 0
    //           WHEN COALESCE(JSON_LENGTH(up.completed_submodules), 0) = COUNT(sm.submodule_id)
    //           THEN 1 ELSE 0
    //         END AS module_completed,

    //         up.module_id AS current_module_id,
    //         up.current_submodule_id AS current_submodule_id,

    //         COALESCE(
    //           JSON_ARRAYAGG(
    //             CASE
    //               WHEN sm.submodule_id IS NULL THEN NULL
    //               ELSE JSON_OBJECT(
    //                 'submodule_id', sm.submodule_id,
    //                 'submodule_name', sm.name,
    //                 'submodule_order_index', sm.order_index,
    //                 'submodule_status',
    //                   CASE
    //                     WHEN JSON_CONTAINS(
    //                       COALESCE(up.completed_submodules, JSON_ARRAY()),
    //                       CAST(sm.submodule_id AS JSON),
    //                       '$'
    //                     )
    //                     THEN 1 ELSE 0
    //                   END
    //               )
    //             END
    //           ),
    //           JSON_ARRAY()
    //         ) AS submodules

    //       FROM modules m

    //       LEFT JOIN (
    //         SELECT *
    //         FROM submodules
    //         ORDER BY module_id, order_index
    //       ) sm ON sm.module_id = m.module_id

    //       LEFT JOIN user_progress up
    //         ON up.module_id = m.module_id
    //       AND up.user_id = ?

    //       GROUP BY
    //         m.module_id, m.name, m.order_index,
    //         up.completed_submodules,
    //         up.module_id,
    //         up.current_submodule_id

    //       ORDER BY m.order_index
    //     ) t;
    //   `;
    const sql =
      `
  WITH module_base AS (
  SELECT
    m.module_id,
    m.name AS module_name,
    m.order_index AS module_order_index,
    up.user_id,
    up.current_submodule_id,
    up.completed_submodules,

    COUNT(sm.submodule_id) AS total_submodules,
    COALESCE(JSON_LENGTH(up.completed_submodules), 0) AS completed_count,

    JSON_ARRAYAGG(
      JSON_OBJECT(
        'submodule_id', sm.submodule_id,
        'submodule_name', sm.name,
        'submodule_order_index', sm.order_index,

        -- 🔹 Submodule status
        'submodule_status',
        CASE
          WHEN JSON_CONTAINS(
            COALESCE(up.completed_submodules, JSON_ARRAY()),
            CAST(sm.submodule_id AS JSON),
            '$'
          ) THEN 2
          WHEN sm.submodule_id = (
            SELECT sm2.submodule_id
            FROM submodules sm2
            WHERE sm2.module_id = m.module_id
              AND NOT JSON_CONTAINS(
                COALESCE(up.completed_submodules, JSON_ARRAY()),
                CAST(sm2.submodule_id AS JSON),
                '$'
              )
            ORDER BY sm2.order_index
            LIMIT 1
          ) THEN 1
          ELSE 0
        END
      )
    ) AS submodules

  FROM modules m
  LEFT JOIN submodules sm ON sm.module_id = m.module_id
  LEFT JOIN user_progress up
    ON up.module_id = m.module_id
   AND up.user_id = ?

  GROUP BY
    m.module_id,
    m.name,
    m.order_index,
    up.user_id,
    up.current_submodule_id,
    up.completed_submodules
),

module_status_ranked AS (
  SELECT
    *,
    CASE
  WHEN total_submodules = 0 THEN 0          -- 🚫 no submodules → LOCKED
  WHEN completed_count = total_submodules THEN 2
  ELSE 0
END AS raw_module_status

  FROM module_base
),

final_modules AS (
  SELECT
    *,
    CASE
      WHEN raw_module_status = 2 THEN 2
      WHEN ROW_NUMBER() OVER (
        ORDER BY module_order_index
      ) = (
        SELECT MIN(module_order_index)
        FROM module_status_ranked
        WHERE raw_module_status = 0
      ) THEN 1
      ELSE 0
    END AS module_status
  FROM module_status_ranked
)

SELECT JSON_OBJECT(
  'total_completed_modules',
    SUM(module_status = 2),
  'modules',
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'module_id', module_id,
        'module_name', module_name,
        'module_order_index', module_order_index,
        'status', module_status,
        'current_submodule_id', current_submodule_id,
        'submodules', submodules
      )
    )
) AS result
FROM final_modules;

  `



    const [rows] = await db.execute(sql, [userId]);

    // rows[0].result will be JSON array OR null
    let result = rows?.[0]?.result;

    // If MySQL returns JSON as string, parse it
    if (typeof result === "string") {
      result = JSON.parse(result);
    }

    // If no data, return empty array
    return result || [];
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
        content_type: s.content_type,
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

  static async getModuleById(moduleId) {
    const [rows] = await db.execute(
      `SELECT * FROM modules WHERE module_id = ?`,
      [moduleId]
    );
    return rows[0];
  }


  static async getNextByOrder(currentOrderIndex) {
    const sql = `
    SELECT *
    FROM modules
    WHERE order_index > ?
    ORDER BY order_index ASC
    LIMIT 1
  `;

    const [rows] = await db.execute(sql, [currentOrderIndex]);

    return rows.length > 0 ? rows[0] : null;
  }

}


module.exports = { Modules };