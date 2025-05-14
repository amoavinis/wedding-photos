const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();

const app = express();

app.use(cors({origin: true}));
app.use(express.json());

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

/**
 * Verifies the validity of an AppCheck token.
 * @param {string} token - The AppCheck token to verify.
 * @return {Promise<boolean>} True if the token is valid, false otherwise.
 */
async function verifyAppCheckToken(token) {
  try {
    const decodedToken = await admin.appCheck().verifyToken(token);
    console.log("Valid AppCheck token:", decodedToken.appId);
    return true;
  } catch (error) {
    console.error("Invalid AppCheck token:", error);
    return false;
  }
}

exports.appCheckToken = functions.https.onRequest(async (req, res) => {
  // Handle CORS preflight (OPTIONS request)
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers",
        "X-Firebase-AppCheck, Content-Type");
    res.status(204).send(""); // Send empty response for OPTIONS
    return;
  }

  // Handle actual GET request
  res.set("Access-Control-Allow-Origin", "*");
  const appCheckToken = req.header("X-Firebase-AppCheck");
  if (!appCheckToken) {
    res.status(401).send("Unauthorized");
    return;
  }

  const isValid = await verifyAppCheckToken(appCheckToken);
  if (isValid) {
    // Proceed with your logic
    res.send("Valid request!");
  } else {
    res.status(403).send("Forbidden");
  }
});

/**
 * Verifies the validity of an AppCheck token.
 * @param {string} collectionName - The AppCheck token to verify.
 * @return {Promise<boolean>} True if the token is valid, false otherwise.
 */
const createGetCollectionHandler = (collectionName) => {
  return functions.https.onRequest(async (req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET");
      res.set("Access-Control-Allow-Headers",
          "X-Firebase-AppCheck, Content-Type");
      res.status(204).send("");
      return;
    }

    // Handle actual request
    res.set("Access-Control-Allow-Origin", "*");
    const appCheckToken = req.header("X-Firebase-AppCheck");

    if (!appCheckToken) {
      res.status(401).send("Unauthorized");
      return;
    }

    const isValid = await verifyAppCheckToken(appCheckToken);
    if (!isValid) {
      res.status(403).send("Forbidden");
      return;
    }

    try {
      const snapshot = await admin.firestore().collection(collectionName).get();
      const data = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
      res.json(data);
    } catch (err) {
      console.error(`Error fetching ${collectionName}:`, err);
      res.status(500).send("Internal Server Error");
    }
  });
};

exports.getUsers = createGetCollectionHandler("users");

exports.getMedia = createGetCollectionHandler("media");

exports.getWishes = createGetCollectionHandler("messages");

/**
 * Helper method
 * @param {any} req // req
 * @param {any} res // res
 * @param {any} handler // handler
 * @return {Promise<any>}
 */
async function handleRequest(req, res, handler) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res
        .set("Access-Control-Allow-Origin", "*")
        .set("Access-Control-Allow-Methods", "POST, OPTIONS")
        .set("Access-Control-Allow-Headers",
            "Content-Type, X-Firebase-AppCheck")
        .status(204)
        .send("");
    return;
  }
  res.set("Access-Control-Allow-Origin", "*");

  const appCheckToken = req.header("X-Firebase-AppCheck");
  if (!appCheckToken) {
    return res.status(401).send("Missing AppCheck token");
  }
  let valid;
  try {
    await verifyAppCheckToken(appCheckToken);
    valid = true;
  } catch (e) {
    valid = false;
  }
  if (!valid) {
    return res.status(403).send("Forbidden – invalid AppCheck");
  }

  try {
    const result = await handler(req);
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).send(e.message);
  }
}

exports.uploadUser = functions.https.onRequest((req, res) =>
  handleRequest(req, res, async (req) => {
    const {username} = req.body;
    if (!username) throw new Error("username required");

    const doc = await admin.firestore().collection("users").add({
      name: username,
    });
    return {id: doc.id};
  }),
);

exports.uploadWish = functions.https.onRequest((req, res) =>
  handleRequest(req, res, async (req) => {
    const {message, userId} = req.body;
    if (!userId) {
      throw new Error("wish + userId required");
    }
    const doc = await admin
        .firestore()
        .collection("messages")
        .add({
          message: message,
        });
    return {id: doc.id};
  }),
);

exports.uploadMedia = functions.https.onRequest((req, res) =>
  handleRequest(req, res, async (req) => {
    const {body} = req;

    const requiredFields = ["filename", "type", "size", "userId",
      "username", "preview", "downloadURL"];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required field(s): ${missingFields.join(", ")}`);
    }

    const item = {
      filename: body.filename,
      type: body.type,
      size: body.size,
      userId: body.userId,
      username: body.username,
      preview: body.preview,
      downloadURL: body.downloadURL,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const doc = await admin
        .firestore()
        .collection("media")
        .add(item);

    return {success: true, result: doc};
  }),
);
