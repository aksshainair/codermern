const path = require("path");
const { exec } = require("child_process");

const executePy = (filepath) => {
  const jobId = path.basename(filepath).split(".")[0];
  const codefolder = path.dirname(filepath);

  return new Promise((resolve, reject) => {
    exec(
      `python -u "${filepath}" < "${codefolder}/${jobId}.txt"`,
      (error, stdout, stderr) => {
        error && reject({ error, stderr });
        stderr && reject(stderr);
        resolve(stdout);
      }
    );
  });
};

module.exports = {
  executePy,
};
