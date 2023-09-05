const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const dirCodes = path.join(__dirname, "codes");

if (!fs.existsSync(dirCodes)) {
  fs.mkdirSync(dirCodes, { recursive: true });
}

const generateFile = async (format, content, input) => {
  const jobId = uuid();

  const filename = `${jobId}.${format}`;
  const filepath = path.join(dirCodes, filename);

  const inpfilename = `${jobId}.txt`;
  const inppath = path.join(dirCodes, inpfilename);

  await fs.writeFileSync(filepath, content);
  await fs.writeFileSync(inppath, input);
  return filepath;
};

module.exports = {
  generateFile,
};
