const S3 = require("aws-sdk/clients/s3"),
  crypto = require("crypto");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

function uploadFile(file) {
  // const fileStream = fs.createReadStream(file.path);
  const result = Promise.all(
    file.map(async (item) => {
      console.log(item, "item");
      const fileName = `${item.fieldname}/${crypto
        .randomBytes(20)
        .toString("hex")}.${item.mimetype.split("/")[1]}`;
      const uploadParams = {
        Bucket: bucketName,
        Body: item.buffer,
        Key: fileName,
      };
      return await s3.upload(uploadParams).promise();
    })
  );
  console.log(result, "result in se service");
  return result;
}

exports.uploadFile = uploadFile;
