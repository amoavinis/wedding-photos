import { useState, useEffect, useCallback, useMemo } from "react";
import { uploadUser, uploadMediaBatch, uploadWish } from "../services/firebase";
import "../css/UploadPage.css";
import Modal from "./Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

export default function UploadPage({ callbackFn }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [wish, setWish] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    let user = getUserLoggedIn();
    setUserId(user.id);
    setUsername(user.name);
  }, []);

  function getUserLoggedIn() {
    let userObjStr = localStorage.getItem("userLoggedIn");
    if (userObjStr) {
      return JSON.parse(userObjStr);
    } else {
      return { id: null, name: "" };
    }
  }

  const openFileDialog = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.multiple = true;
    input.onchange = (event) => {
      const files = Array.from(event.target.files);
      setSelectedFiles([...selectedFiles, ...files]);
    };
    input.click();
  }, [selectedFiles]);

  const removeFile = useCallback((index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  }, [selectedFiles]);

  async function submit() {
    setLoading(true);

    let u_id = await addNewUser();

    await addWish(u_id);
    await uploadFiles(u_id);
    setLoading(false);

    setShowThankYou(true); // Show thank you modal

    // Auto-close after 5 seconds and execute callback
    setTimeout(() => {
      setShowThankYou(false);
      callbackFn();
    }, 5000);
  }

  async function addNewUser() {
    if (!userId || username !== getUserLoggedIn().name) {
      let res = await uploadUser(username);
      let userObj = { id: res.id, name: username };
      localStorage.setItem("userLoggedIn", JSON.stringify(userObj));
      setUserId(res.id);
      return res.id;
    }
    return userId;
  }

  async function uploadFiles(u_id) {
    await uploadMediaBatch(selectedFiles, u_id, username, updateLoadingBar);
  }

  async function addWish(u_id) {
    await uploadWish(wish, u_id, username);
  }

  function updateLoadingBar(value) {
    setProgress(value);
  }

  const openMediaModal = useCallback((file, index) => {
    setSelectedMedia({ file, index, url: URL.createObjectURL(file) });
  }, []);

  function closeMediaModal() {
    setSelectedMedia(null);
  }

  const filePreviews = useMemo(() => {
    return selectedFiles.map((file, index) => {
      const url = URL.createObjectURL(file);

      const isVideo = file.type.startsWith("video");

      const preview = (
        <div
          key={index}
          className="preview-item"
          onClick={() => openMediaModal(file, index)}
          style={{ cursor: "pointer" }}
        >
          {isVideo ? (
            <>
              <video className="preview-img" preload="metadata">
                <source src={url} type="video/mp4" />
              </video>
              <div className="video-player-play-container-upload">
                <div className="video-player-play-circle-1">
                  <FontAwesomeIcon icon={faPlay} className="play-icon" />
                </div>
              </div>
            </>
          ) : (
            <img src={url} className="preview-img" alt="preview" />
          )}
          {!loading && (
            <button
              className="remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                removeFile(index);
              }}
            >
              X
            </button>
          )}
        </div>
      );

      return preview;
    });
  }, [selectedFiles, loading, removeFile, openMediaModal]);

  return (
    <>
      {/* Loading Modal */}
      <Modal isOpen={loading}>
        <div>
          {/* Progress bar */}
          <div className="loading-container">
            <div
              className="loading-bar"
              style={{
                width: `${progress}%`,
                backgroundColor: "green",
              }}
            />
            <div className="loading-text">{Math.round(progress)}%</div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "0.9rem",
            }}
          >
            Οι φωτογραφίες και οι ευχές ανεβαίνουν, παρακαλώ περιμένετε...
          </div>
        </div>
      </Modal>

      {/* Thank You Modal */}
      <Modal
        isOpen={showThankYou}
        onClose={() => {
          setShowThankYou(false);
          callbackFn();
        }}
      >
        <div className="thank-you-modal">
          <div className="thank-you-icon">✓</div>
          <h2>Σας ευχαριστούμε για τις φωτογραφίες και τις ευχές!</h2>
          <p>Οι φωτογραφίες και οι ευχές σας έχουν αποσταλεί με επιτυχία.</p>
          <p>Αυτό το παράθυρο θα κλείσει αυτόματα...</p>
        </div>
      </Modal>

      {/* Media Preview Modal */}
      {selectedMedia && (
        <Modal isOpen={true} onClose={closeMediaModal}>
          <div>
            {selectedMedia.file.type.startsWith("video") ? (
              <video
                controls
                autoPlay
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              >
                <source
                  src={selectedMedia.url}
                  type={selectedMedia.file.type}
                />
              </video>
            ) : (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img src={selectedMedia.url} />
            )}
          </div>
        </Modal>
      )}

      <div className="upload-container">
        <div className="instructions-box">
          <h3>Οδηγίες Ανέβασματος:</h3>
          <div className="box">
            <div className="line">
              1. Συμπληρώστε το όνομά σας στο πάνω αριστερό πεδίο
            </div>
            <div className="line">
              2. Πατήστε "Επιλογή αρχείων" για να επιλέξετε φωτογραφίες ή βίντεο
            </div>
            <div className="line">
              3. Μπορείτε να κάνετε κλικ σε κάθε αρχείο για προεπισκόπηση
            </div>
            <div className="line">
              4. Γράψτε την ευχή σας στο κάτω πεδίο κειμένου
            </div>
            <div className="line">5. Πατήστε "Ανέβασμα" όταν είστε έτοιμοι</div>
          </div>
          <p className="note">
            Σημείωση: Μπορείτε να ανεβάσετε πολλαπλά αρχεία ταυτόχρονα
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            gap: 10,
          }}
        >
          {/* Insert username */}
          <div
            className="input-container"
            style={{
              height: 50,
              width: "calc(70% - 10px)",
            }}
          >
            <input
              style={{
                height: "100%",
                width: "100%",
                borderRadius: 10,
                borderWidth: 1,
                paddingLeft: 10,
              }}
              placeholder="Όνομα χρήστη που ανεβάζει"
              defaultValue={username}
              readOnly={loading}
              onChange={($event) => setUsername($event.target.value)}
            />
          </div>
          {/* Select files */}
          <div
            style={{
              height: 50,
              width: "30%",
            }}
          >
            <button
              onClick={openFileDialog}
              className={
                loading ? "file-select-btn disabled" : "file-select-btn"
              }
              disabled={loading}
            >
              Επιλογή αρχείων
            </button>
          </div>
        </div>

        {/* View selected files */}
        <div className="preview-container">
          {filePreviews}
        </div>
        {/* Insert wish */}
        <div
          className="input-container"
          style={{
            height: 100,
          }}
        >
          <textarea
            style={{
              height: "calc(100% - 20px)",
              width: "100%",
              resize: "none",
              borderRadius: 10,
              borderWidth: 1,
              padding: 10,
            }}
            placeholder="Ευχή"
            defaultValue={wish}
            readOnly={loading}
            onChange={($event) => setWish($event.target.value)}
          />
        </div>

        <div>
          {/* Submit buttons */}
          <div className="button-row">
            <button
              onClick={callbackFn}
              className={loading ? "close-btn disabled" : "close-btn"}
              disabled={loading}
            >
              Ακύρωση
            </button>
            <button
              onClick={submit}
              disabled={selectedFiles.length === 0 || !username || loading}
              className={
                selectedFiles.length === 0 || !username || loading
                  ? "confirm-btn disabled"
                  : "confirm-btn"
              }
            >
              Ανέβασμα
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
