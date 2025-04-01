import { useState } from "react";
import "../App.css";

export default function UploadModal({ uploadFn, closeModalFn }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [username, setUsername] = useState("");

  const openFileDialog = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.multiple = true;
    input.onchange = (event) => {
      const files = Array.from(event.target.files);
      setSelectedFiles([...selectedFiles, ...files]);
    };
    input.click();
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const uploadFiles = () => {
    const urls = selectedFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
      username: username
    }));
    uploadFn(urls);
    setSelectedFiles([]);
    closeModalFn();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div>
          <h2>Select photos to upload</h2>
          <button onClick={openFileDialog} className="file-select-btn">
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
              <button className="remove-btn" onClick={() => removeFile(index)}>
                X
              </button>
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
            placeholder="Όνομα"
            onKeyUp={($event) => setUsername($event.target.value)}
          />
        </div>
        <div className="button-row">
          <button onClick={() => closeModalFn()} className="close-btn">
            Close
          </button>
          <button
            onClick={uploadFiles}
            disabled={selectedFiles.length === 0 || !username}
            className={
              selectedFiles.length === 0 || !username
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
