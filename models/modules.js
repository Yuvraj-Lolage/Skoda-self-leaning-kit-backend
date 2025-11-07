const db = require("../config/db");

class Modules {

    Modules(){}

    static async getAllModulesWithSubmodules (){
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

}



module.exports = {
    Modules
}