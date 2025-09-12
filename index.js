const express = require('express');
const db =  require("./config/db")

const { userRouter } = require('./routes/user_router');


const app = express();
const PORT = 3000;

//middlewares
app.use(express.json());
app.use('/user', userRouter);


app.get('/',(req, res) => {
    const data = db.query('SELECT * FROM user');
    res.send('Hello world!');
})


app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}` 
    );
})
