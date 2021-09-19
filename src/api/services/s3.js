const S3 = require("aws-sdk/clients/s3");
const fs = require("fs"),
  util = require("util"),
  unlinkFile = util.promisify(fs.unlink);

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

// upload a file to s3
function uploadFile(file) {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename,
  };

  return s3.upload(uploadParams).promise();
}

// download a file from s3
 function getFileStream(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName,
  };
  // const data = await s3.getObject(downloadParams).promise();
  // console.log(data.Body, "data.body");
  // if (data.Body) {
  //   return data.Body.toString("utf-8");
  // } else {
  //   return undefined;
  // }
  return s3.getObject(downloadParams).createReadStream();
}

exports.getFileStream = getFileStream;

exports.uploadFile = uploadFile;
