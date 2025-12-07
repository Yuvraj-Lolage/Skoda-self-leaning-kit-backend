const express = require('express');
const db =  require("./config/db")
const cors = require('cors');
const path = require("path");

const { userRouter } = require('./routes/user_router');
const ModulesRouter = require('./routes/module_router');
const SubModuleRouter = require('./routes/sub_module_router');


const app = express();
const PORT = 3000;

//middlewares
app.use(cors());
app.use(express.json());
app.use('/user', userRouter);
app.use('/module', ModulesRouter);
app.use('/submodule', SubModuleRouter);

//shared folder setup
const sharedFolder = "/Users/yuvrajsatishlolage/Projects/Skoda_project/Skoda-self-leaning-kit-backend/network_shared_folder"
app.use("/videos", express.static(sharedFolder));



app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}` 
    );
})
