const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require('dotenv').config();


// mongoose.connect('mongodb://127.0.0.1:27017/compilerdb');

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('Connected to MongoDB Atlas');
})
.catch((err) => {
  console.error('Error connecting to MongoDB Atlas:', err);
});

const { generateFile } = require("./generateFile");

const { addJobToQueue } = require("./jobQueue");
const Job = require("./models/Job");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/run", async (req, res) => {
  const { language = "cpp", code, input } = req.body;

  console.log(language, "Length:", code.length);

  if (code === undefined) {
    return res.status(400).json({ success: false, error: "Empty code body!" });
  }
  // need to generate a c++ file with content from the request
  const filepath = await generateFile(language, code, input);
  // write into DB
  const job = await new Job({ language, filepath}).save();
  const jobId = job["_id"];
  addJobToQueue(jobId);
  res.status(201).json({ jobId });
});

app.get("/status", async (req, res) => {
  const jobId = req.query.id;

  if (jobId === undefined) {
    return res
      .status(400)
      .json({ success: false, error: "missing id query param" });
  }

  const job = await Job.findById(jobId);

  if (job === undefined) {
    return res.status(400).json({ success: false, error: "couldn't find job" });
  }

  return res.status(200).json({ success: true, job });
});

app.listen(5001, () => {
  console.log(`Listening on port 5001!`);
});
