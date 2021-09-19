require("dotenv").config();
const AWS = require("aws-sdk"),
  crypto = require("crypto"),
  ID = process.env.AWS_KEY,
  SECRET = process.env.AWS_SECRET,
  BUCKET_NAME = process.env.BUCKET_NAME,
  s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET,
  });

module.exports = {
  uploadFile: (fileContent) => {
    return new Promise((resolve, reject) => {
      const fileName = `${fileContent.fieldname}/${crypto
        .randomBytes(20)
        .toString("hex")}.${fileContent.mimetype.split("/")[1]}`;
      const base64data = new Buffer.from(fileContent.buffer, "binary");
      const params = {
        Bucket: BUCKET_NAME,
        Key: fileName, // File name you want to save as in S3
        Body: base64data,
        ContentType: fileContent.mimetype,
      };
      s3.upload(params, function (err, data) {
        if (err) {
          return reject(err);
        }
        console.log(`File uploaded successfully. ${data.Location}`);
        resolve(data.Location);
      });
    });
  },
};
