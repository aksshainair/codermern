const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
// const fse = require('fs-extra')

const outputPath = path.join(__dirname, "outputs");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const executeCpp = (filepath) => {
  const jobId = path.basename(filepath).split(".")[0];
  const outPath = path.join(outputPath, `${jobId}.out`);
  const codefolder = path.dirname(filepath);

  return new Promise((resolve, reject) => {
    exec(
      `g++ "${filepath}" -o "${outPath}" && cd "${outputPath}" && ./${jobId}.out < "${codefolder}/${jobId}.txt"`,
      (error, stdout, stderr) => {
        error && reject({ error, stderr });
        stderr && reject(stderr);
        resolve(stdout);
        // fse.emptyDirSync(outputPath);
        // fse.emptyDirSync(codePath);
      }
    );
  });
};

module.exports = {
  executeCpp,
};
