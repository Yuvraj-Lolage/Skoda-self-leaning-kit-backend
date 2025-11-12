const db = require("../config/db");

class SubModule {

    SubModule(){}

    static async getSubModuleWithId (id){
        const [rows] = await db.query(`select * from submodules where submodule_id = 1;`);

        const modulesMap = {};
        return rows[0];
    };

}



module.exports = {
    SubModule
}