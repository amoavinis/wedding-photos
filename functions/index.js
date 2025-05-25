const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const bucket = admin.storage().bucket();

exports.downloadFile = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  try {
    // Get file path from query parameter
    const filePath = req.query.filePath;
    if (!filePath) {
      return res.status(400).send("File path is required");
    }

    // Create file reference
    const file = bucket.file(`media/${filePath}`);

    // Verify file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).send("File not found");
    }

    // Get file metadata for filename and content type
    const [metadata] = await file.getMetadata();

    // Set headers to force download
    res.set("Content-Type", metadata.contentType || "application/octet-stream");
    res.set(
        "Content-Disposition",
        `attachment; filename="${filePath.replace(/^media_\//, "")}"`,
    );

    // Stream the file to the response
    file
        .createReadStream()
        .on("error", (error) => {
          console.error("Stream error:", error);
          res.status(500).end();
        })
        .pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).send("Download failed");
  }
});
