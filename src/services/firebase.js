import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import {
  addDoc,
  collection,
  getFirestore,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Compressor from "compressorjs";
import { firebaseConfig } from "../config/config";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

// Authentication helper
export async function authenticate() {
  await signInAnonymously(auth);
}

export async function fetchPhotos() {
  await authenticate();

  const auth = getAuth(app);
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be logged in to view media");
  }

  const mediaRef = await getDocs(collection(db, "media"));

  const media = mediaRef.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return media;
}

export async function getUserFolders() {
  await authenticate();

  const auth = getAuth(app);
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be logged in to view folders");
  }

  const usersRef = await getDocs(collection(db, "users"));

  const users = usersRef.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return users;
}

export async function getUserPhotos(userId) {
  const q = query(collection(db, "media"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getUserWishes(userId) {
  const q = query(collection(db, "messages"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function uploadUser(username) {
  await authenticate();

  const auth = getAuth(app);
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be logged in to upload user info");
  }

  const docRef = await addDoc(collection(db, "users"), { name: username });

  return docRef;
}

export async function uploadWish(wish, userId, username) {
  await authenticate();

  const auth = getAuth(app);
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

// 1. Polyfill toBlob() if the browser lacks it
if (!HTMLCanvasElement.prototype.toBlob) {
  Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
    value: function (callback, type, quality) {
      // Fallback via toDataURL → Blob
      const dataURL = this.toDataURL(type, quality); // :contentReference[oaicite:0]{index=0}
      const binStr = atob(dataURL.split(",")[1]);
      const len = binStr.length;
      const arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) arr[i] = binStr.charCodeAt(i);
      callback(new Blob([arr], { type: type || "image/png" }));
    },
  });
}

// 2. Main compression function
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const MAX_W = 720,
      MAX_H = 720;

    reader.onerror = () => reject(reader.error);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image load failed"));
      img.onload = () => {
        const { width, height } = img;

        // If already small enough, just return the original Data-URL
        if (width <= MAX_W && height <= MAX_H) {
          return resolve(e.target.result);
        }

        // Compute scaled dimensions
        let newW,
          newH,
          ratio = width / height;
        if (width > height) {
          newW = MAX_W;
          newH = MAX_W / ratio;
        } else {
          newH = MAX_H;
          newW = MAX_H * ratio;
        }

        // 3. Attempt compression
        try {
          new Compressor(file, {
            // :contentReference[oaicite:3]{index=3}
            width: newW,
            height: newH,
            success(blob) {
              const r2 = new FileReader();
              r2.onerror = () => reject(r2.error); // :contentReference[oaicite:4]{index=4}
              r2.onload = (ev) => resolve(ev.target.result);
              r2.readAsDataURL(blob);
            },
            error(err) {
              // On Compressor failure, reject and fall through to catch below
              reject(err); // :contentReference[oaicite:5]{index=5}
            },
          });
        } catch (err) {
          reject(err); // :contentReference[oaicite:6]{index=6}
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }).catch((err) => {
    console.warn("Compression failed, using original Data-URL:", err);
    // Fallback: return original file as Data-URL
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = () => rej(fr.error);
      fr.onload = (e) => res(e.target.result);
      fr.readAsDataURL(file);
    });
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

  const auth = getAuth(app);
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
              filename: file.name,
              type: file.type,
              size: file.size,
              userId: userId,
              username: username,
              preview: preview,
              downloadURL: downloadURL,
            };

            const response = await addDoc(collection(db, "media"), data);

            resolve({ id: response.id, ...data });
          }
        );
      });

      return await promise;
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
