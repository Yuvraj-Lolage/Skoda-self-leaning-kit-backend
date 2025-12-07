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








//////////////////////////////////////////////////////////
// -------------------- FILE UPLOAD --------------------
// const upload = multer({ dest: "uploads/" });

// app.post("/upload", verifyToken, upload.single("file"), (req, res) => {
//   if (req.user.role !== "superadmin")
//     return res.status(403).json({ error: "Access denied" });

//   const { moduleId, submoduleId } = req.body;
//   if (!moduleId || !submoduleId)
//     return res.status(400).json({ error: "Module & Submodule required" });

//   const originalPath = req.file.path;

//   // Create storage directory
//   const saveDir = path.join(__dirname, "saved_quizzes");
//   if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);

//   // Determine version
//   if (!quizVersions[moduleId]) quizVersions[moduleId] = {};
//   if (!quizVersions[moduleId][submoduleId]) quizVersions[moduleId][submoduleId] = [];

//   const newVersion = quizVersions[moduleId][submoduleId].length + 1;

//   // Save file with version number
//   const savedFileName = `module_${moduleId}_sub_${submoduleId}_v${newVersion}.xlsx`;
//   const savedFilePath = path.join(saveDir, savedFileName);

//   fs.copyFileSync(originalPath, savedFilePath);

//   // Convert Excel to JSON
//   const workbook = xlsx.readFile(originalPath);
//   const sheet = workbook.Sheets[workbook.SheetNames[0]];
//   const rows = xlsx.utils.sheet_to_json(sheet);

//   const parsedQuiz = rows.map((row, idx) => ({
//     id: `${moduleId}_${submoduleId}_v${newVersion}_q${idx + 1}`,
//     moduleId: row.ModuleID,
//     submoduleId: row.SubmoduleID,
//     question: row.Question,
//     options: [
//       { key: "A", text: row.OptionA },
//       { key: "B", text: row.OptionB },
//       { key: "C", text: row.OptionC },
//       { key: "D", text: row.OptionD },
//     ],
//     correct: row.Correct,
//   }));

//   // Store version
//   quizVersions[moduleId][submoduleId].push({
//     version: newVersion,
//     filePath: savedFilePath,
//     quizData: parsedQuiz,
//     uploadDate: new Date(),
//   });

//   res.json({
//     message: "Quiz uploaded successfully!",
//     version: newVersion,
//     file: savedFileName,
//   });
// });
