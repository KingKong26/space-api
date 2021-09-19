const Jimp = require("jimp");

class FileUpload {
  async fileUpload(files) {
    const resizedBuffer = await Promise.all(
      files.map(async (element) => {
        let fileType = element.mimetype.split("/");
        if (fileType[0] === "image") {
          const file = await Jimp.read(
            Buffer.from(element.buffer, "base64")
          ).then(async (image) => {
            image.resize(677.4, Jimp.AUTO).quality(70);
            return image.getBufferAsync(Jimp.AUTO);
          });
          element.buffer = file;
        }
        return element;
      })
    );
    return resizedBuffer;
  }
}

module.exports = new FileUpload();
