const express = require("express");
const db = require("./config/db");
const cors = require("cors");
const path = require("path");

// Routers
const { userRouter } = require("./routes/user_router");
const ModulesRouter = require("./routes/module_router");
const SubModuleRouter = require("./routes/sub_module_router");
const AssessmentRouter = require("./routes/assessment_router");
const LeaderboardRouter = require("./routes/leaderboard_router");

const app = express();
const PORT = 3000;

// ===================== MIDDLEWARES =====================
app.use(cors());
app.use(express.json());

// ===================== ROUTES =====================
app.use("/user", userRouter);
app.use("/module", ModulesRouter);
app.use("/submodule", SubModuleRouter);
app.use("/assessment", AssessmentRouter);
app.use("/leaderboard", LeaderboardRouter); 

// ===================== SHARED FOLDER =====================
const sharedFolder =
  "/Users/yuvrajsatishlolage/Projects/Skoda_project/Skoda-self-leaning-kit-backend/network_shared_folder";

app.use("/videos", express.static(sharedFolder));

// ===================== SERVER =====================
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});