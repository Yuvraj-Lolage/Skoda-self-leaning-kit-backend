const db = require("../config/db");

class SubModule {

    SubModule(){}

    static async getSubModuleWithId (id){
        const [rows] = await db.query(`select * from submodules where submodule_id = 1;`);

        const modulesMap = {};
        return rows[0];
    };

    static async getSubModuleInModuleWithId (moduleId, submoduleId){
        const [rows] = await db.query(`select * from submodules where module_id = ${ moduleId } and  submodule_id = ${ submoduleId };`);
        return rows[0];
    };

    static async getSubMoudulesInModule(module_id){
        const [rows] = await db.query(`select * from submodules where module_id = ${ module_id } ORDER BY order_index;`);
        return rows;
    };

    static async createSubModule({
    module_id,
    submodule_name,
    submodule_description,
    order_index,
    duration
  }) {
    const [result] = await db.execute(
      `INSERT INTO submodules
       (module_id, name, description, order_index, duration)
       VALUES (?, ?, ?, ?, ?)`,
      [module_id, submodule_name, submodule_description, order_index, duration]
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

}



module.exports = {
    SubModule
}