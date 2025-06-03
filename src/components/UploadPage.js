import { useState, useEffect } from "react";
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

  function openFileDialog() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.multiple = true;
    input.onchange = (event) => {
      const files = Array.from(event.target.files);
      setSelectedFiles([...selectedFiles, ...files]);
    };
    input.click();
  }

  function removeFile(index) {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  }

  async function submit() {
    setLoading(true);

    let u_id = await addNewUser();

    await addWish(u_id);
    await uploadFiles();
    setLoading(false);
    callbackFn();
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

  async function uploadFiles() {
    await uploadMediaBatch(selectedFiles, userId, username, updateLoadingBar);
  }

  async function addWish(u_id) {
    await uploadWish(wish, u_id, username);
  }

  function updateLoadingBar(value) {
    setProgress(value);
  }

  function openMediaModal(file, index) {
    setSelectedMedia({ file, index, url: URL.createObjectURL(file) });
  }

  function closeMediaModal() {
    setSelectedMedia(null);
  }

  return (
    <>
      {/* Loading Modal */}
      <Modal isOpen={loading}>
        <>
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
            }}
          >
            Σας ευχαριστούμε για τις φωτογραφίες και τις ευχές!
          </div>
        </>
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
              <img
                src={selectedMedia.url}
                style={{ height: "80vh", width: "auto" }}
              />
            )}
          </div>
        </Modal>
      )}

      <div className="upload-container">
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
              onKeyUp={($event) => setUsername($event.target.value)}
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
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="preview-item"
              onClick={() => openMediaModal(file, index)}
              style={{ cursor: "pointer" }}
            >
              {file.type.startsWith("video") ? (
                <>
                  <video className="preview-img" preload="metadata">
                    <source src={URL.createObjectURL(file)} type="video/mp4" />
                  </video>
                  <div className="video-player-play-container-upload">
                    <div className="video-player-play-circle">
                      <FontAwesomeIcon
                        icon={faPlay}
                        style={{ color: "white", fontSize: "40px" }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                // eslint-disable-next-line jsx-a11y/alt-text
                <img src={URL.createObjectURL(file)} className="preview-img" />
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
          ))}
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
            onKeyUp={($event) => setWish($event.target.value)}
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
