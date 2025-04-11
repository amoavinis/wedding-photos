import { useState } from "react";
import "../App.css";
import { uploadMediaBatch } from "../services/firebase";

export default function UploadModal({ uploadFn, closeModalFn }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [username, setUsername] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

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

  async function uploadFiles() {
    setLoading(true);
    let toEmit = await uploadMediaBatch(
      selectedFiles,
      username,
      updateLoadingBar
    );

    uploadFn(toEmit);
    setSelectedFiles([]);
    setLoading(false);
    closeModalFn();
  }

  function updateLoadingBar(value) {
    setProgress(value);
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <div>
          <h2>Select photos to upload</h2>
          <button
            onClick={openFileDialog}
            className={loading ? "file-select-btn disabled" : "file-select-btn"}
            disabled={loading}
          >
            Choose Files
          </button>
        </div>
        <div className="preview-container">
          {selectedFiles.map((file, index) => (
            <div key={index} className="preview-item">
              {file.type.startsWith("video") ? (
                <video width="100%" controls="controls" preload="metadata">
                  <source
                    src={URL.createObjectURL(file)}
                    type="video/mp4"
                  ></source>
                </video>
              ) : (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="preview-img"
                />
              )}
              {!loading && (
                <button
                  className="remove-btn"
                  onClick={() => removeFile(index)}
                >
                  X
                </button>
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: 50,
            gap: 20,
          }}
        >
          <span>Όνομα χρήστη που ανεβάζει: </span>
          <input
            style={{
              height: "100%",
              width: "30%",
              borderRadius: 10,
              borderWidth: 1,
            }}
            readOnly={loading}
            placeholder="Όνομα"
            onKeyUp={($event) => setUsername($event.target.value)}
          />
        </div>
        {progress > 0 && (
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
        )}

        <div className="button-row">
          <button
            onClick={() => closeModalFn()}
            className={loading ? "close-btn disabled" : "close-btn"}
            disabled={loading}
          >
            Close
          </button>
          <button
            onClick={uploadFiles}
            disabled={selectedFiles.length === 0 || !username || loading}
            className={
              selectedFiles.length === 0 || !username || loading
                ? "confirm-btn disabled"
                : "confirm-btn"
            }
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
