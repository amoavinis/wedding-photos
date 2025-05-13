import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import Compressor from "compressorjs";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
} from "firebase/app-check";
import { firebaseConfig } from "../config/config";

const app = initializeApp(firebaseConfig);

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6Ldq9TMrAAAAAOZ0mIXtF5TRNzntplep3QZlmYWT"),
  isTokenAutoRefreshEnabled: true,
});

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

// Authentication helper
export async function authenticate() {
  await signInAnonymously(auth);
}

async function callFunction(url, method, body) {
  // Get AppCheck token
  const appCheckToken = await getToken(appCheck);

  const res = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "X-Firebase-AppCheck": appCheckToken.token,
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchPhotos() {
  await authenticate();

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be logged in to view media");
  }

  const media = await callFunction(
    "https://us-central1-wedding-photos-36c1e.cloudfunctions.net/getMedia",
    "GET",
    null
  );

  return media;
}

export async function getUserFolders() {
  await authenticate();

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be logged in to view folders");
  }

  // 1. Get all users
  const users = await callFunction(
    "https://us-central1-wedding-photos-36c1e.cloudfunctions.net/getUsers",
    "GET",
    null
  );

  // 2. Get all posts
  const media = await callFunction(
    "https://us-central1-wedding-photos-36c1e.cloudfunctions.net/getMedia",
    "GET",
    null
  );

  // 3. Get all wishes
  const wishes = await callFunction(
    "https://us-central1-wedding-photos-36c1e.cloudfunctions.net/getWishes",
    "GET",
    null
  );

  // 4. Combine them
  const folders = users.map((user) => ({
    ...user,
    media: media.filter(
      (m) => m.userId === user.id || (!m.userId && m.username === user.name)
    ),
    wishes: wishes.filter(
      (w) => w.userId === user.id || (!w.userId && w.username === user.name)
    ),
  }));

  return folders;
}

export async function uploadUser(username) {
  await authenticate();

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be logged in to upload user info");
  }

  const docRef = await addDoc(collection(db, "users"), { name: username });
  return docRef;
}

export async function uploadWish(wish, userId, username) {
  await authenticate();

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be logged in to upload wish");
  }

  const docRef = await addDoc(collection(db, "messages"), {
    message: wish,
    userId: userId,
    username: username,
  });
  return docRef;
}

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const max_width = 400;
    const max_height = 400;

    reader.onload = (e) => {
      const image = new Image();
      image.src = e.target.result;
      image.onload = (rs) => {
        const img_height = rs.currentTarget["height"];
        const img_width = rs.currentTarget["width"];

        if (img_height <= max_height && img_width <= max_width) {
          resolve(e.target.result);
        } else {
          let setBase64Fn = (x) => {
            resolve(x);
          };
          let ratio = img_height / img_width;
          let new_height =
            img_height > img_width ? max_height : max_height * ratio;
          let new_width =
            img_width > img_height ? max_width : max_width / ratio;

          new Compressor(file, {
            width: new_width,
            height: new_height,
            success(result) {
              const reader2 = new FileReader();
              reader2.onload = (e) => {
                setBase64Fn(e.target.result);
              };
              reader2.readAsDataURL(result);
            },
            error(err) {
              console.log(err.message);
            },
          });
        }
      };
    };

    reader.readAsDataURL(file);
  });
}

async function extractFirstFrame(videoFile) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    video.src = URL.createObjectURL(videoFile);
    video.muted = true;

    video.addEventListener("loadeddata", async () => {
      try {
        video.currentTime = 0;
      } catch (err) {
        reject(err);
      }
    });

    video.addEventListener("seeked", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      resolve(dataUrl);
      URL.revokeObjectURL(video.src);
    });

    video.addEventListener("error", reject);
  });
}

export async function uploadMediaBatch(files, userId, username, progressCb) {
  await authenticate();

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be logged in to upload photos");
  }

  const storage = getStorage();

  let totalBytesTransferred = 0;
  let totalBytes = files.map((f) => f.size).reduce((pSum, x) => pSum + x, 0);

  // Create an array to track bytes transferred per file
  const bytesTransferredPerFile = Array(files.length).fill(0);

  const uploadedFiles = await Promise.all(
    files.map(async (file, index) => {
      const storageRef = ref(storage, `media/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      let preview = "";
      if (file.type.startsWith("video")) {
        // Step 1: Extract first frame
        preview = await extractFirstFrame(file);
      } else if (file.type.startsWith("image")) {
        preview = await compressImage(file);
      }

      const promise = new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Track upload progress
            // let snapshotTotalBytes = snapshot.totalBytes;

            // Calculate the delta since last update for this file
            const delta =
              snapshot.bytesTransferred - bytesTransferredPerFile[index];
            bytesTransferredPerFile[index] = snapshot.bytesTransferred;

            // Update the total
            totalBytesTransferred += delta;

            progressCb((100 * totalBytesTransferred) / totalBytes);
          },
          (error) => {
            console.error("Upload failed:", error);
            reject(error);
          },
          async () => {
            // 4. Get download URL after successful upload
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            // 5. Save metadata to Firestore
            const data = {
              preview: preview,
              downloadURL: downloadURL,
              filename: file.name,
              size: file.size,
              type: file.type,
              userId: userId,
              username: username,
              createdAt: serverTimestamp(),
            };
            const docRef = await addDoc(collection(db, "media"), data);

            resolve({ id: docRef.id, downloadURL: downloadURL });
          }
        );
      });
      let requestResult = await promise;

      let toReturn = {
        id: requestResult.id,
        filename: file.name,
        type: file.type,
        size: file.size,
        username: username,
        preview: preview,
        downloadURL: requestResult.downloadURL,
      };

      return toReturn;
    })
  );

  return uploadedFiles;
}

export async function downloadWithCloudFunction(mediaItem) {
  try {
    // Encode the file path for URL safety
    const encodedPath = encodeURIComponent(`${mediaItem.filename}`);
    // Construct the download URL
    const proxyUrl = `https://us-central1-wedding-photos-36c1e.cloudfunctions.net/downloadFile?filePath=${encodedPath}`;

    // Create a temporary iframe for the download
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = proxyUrl;

    document.body.appendChild(iframe);

    // Clean up after some time
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 5000);
  } catch (error) {
    console.error("Proxy download failed:", error);
    // Fallback to direct download
    window.open(mediaItem.url, "_blank");
  }
}

export async function checkAppToken() {
  const appCheckToken = await getToken(appCheck);

  // Call Cloud Function
  const response = await fetch(
    "https://us-central1-wedding-photos-36c1e.cloudfunctions.net/appCheckToken",
    {
      headers: {
        "X-Firebase-AppCheck": appCheckToken.token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return { ok: true, token: appCheckToken.token };
}
