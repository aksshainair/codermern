// const fse = require('fs-extra');
// const fs = require('fs');
// const path = require('path');
const Queue = require("bull");

const Job = require("./models/Job");
const { executeCpp } = require("./executeCpp");
const { executePy } = require("./executePy");

// redis://red-ck64kqddrqvc73a5ggtg:6379


const jobQueue = new Queue("job-runner-queue",{
  redis: {
    host: 'red-ck64kqddrqvc73a5ggtg',
    port: 6379
  }
});
const NUM_WORKERS = 5;

jobQueue.process(NUM_WORKERS, async ({ data }) => {
  const jobId = data.id;
  const job = await Job.findById(jobId);
  if (job === undefined) {
    throw Error(`cannot find Job with id ${jobId}`);
  }
  try {
    let output;
    job["startedAt"] = new Date();
    if (job.language === "cpp") {
      output = await executeCpp(job.filepath);
    } else if (job.language === "py") {
      output = await executePy(job.filepath);
    }

    // const outputPath = path.join(__dirname, "outputs");
    // const codePath = path.join(__dirname, "codes");
    // if (fs.existsSync(codePath)) {
    //   fse.emptyDirSync(codePath)
    // } 
    // if (fs.existsSync(outputPath)) {
    //   fse.emptyDirSync(outputPath)
    // } 

    job["completedAt"] = new Date();
    job["output"] = output;
    job["status"] = "success";
    await job.save();
    return true;
  } catch (err) {
    job["completedAt"] = new Date();
    job["output"] = JSON.stringify(err);
    job["status"] = "error";
    await job.save();
    throw Error(JSON.stringify(err));
  }
});

jobQueue.on("failed", (error) => {
  console.error(error.data.id, error.failedReason);
});

const addJobToQueue = async (jobId) => {
  jobQueue.add({
    id: jobId,
  });
};

module.exports = {
  addJobToQueue,
};
