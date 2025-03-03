import { useState, useEffect } from "react";
import "./App.css";

export default function EventMediaApp() {
  const [mediaList, setMediaList] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const savedMedia = []; //JSON.parse(localStorage.getItem("mediaList")) || [];
    setMediaList(savedMedia);
  }, []);

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
    console.log(selectedFiles[0])
    const urls = selectedFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    const updatedMediaList = [...mediaList, ...urls];
    setMediaList(updatedMediaList);
    localStorage.setItem("mediaList", JSON.stringify(updatedMediaList));
    setSelectedFiles([]);
    setShowModal(false);
  };

  const openMediaModal = (media) => {
    setSelectedMedia(media);
  };

  const closeMediaModal = () => {
    setSelectedMedia(null);
  };

  const downloadMedia = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="h-100">
      <div className="header">
        <div className="title-box">
          <span className="title">Καλώς ήρθατε στο γάμο μας!</span>
        </div>
        <div className="open-modal-box">
          <button
            onClick={() => setShowModal(true)}
            className="open-modal-button"
          >
            Upload
          </button>
        </div>
      </div>
      <div className="body">
        {mediaList.map((media, index) => (
          <div
            key={index}
            onClick={() => openMediaModal(media)}
            className="preview-item"
            style={{ cursor: "pointer" }}
          >
            {media.type.startsWith("image") ? (
              <img
                src={media.url}
                alt="Uploaded Media"
                className="preview-img"
              />
            ) : (
              <video width="100%" controls="controls" preload="metadata">
                <source
                  src="https://www.w3schools.com/html/mov_bbb.mp4#t=0.1"
                  type="video/mp4"
                ></source>
              </video>
            )}
          </div>
        ))}
      </div>

      {showModal && (
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
                        src="https://www.w3schools.com/html/mov_bbb.mp4#t=0.1"
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
                  <button
                    className="remove-btn"
                    onClick={() => removeFile(index)}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
            <div className="button-row">
              <button onClick={() => setShowModal(false)} className="close-btn">
                Close
              </button>
              <button onClick={uploadFiles} className="confirm-btn">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMedia && (
        <div className="modal" onClick={closeMediaModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.type.startsWith("image") ? (
              <img
                src={selectedMedia.url}
                alt="Full View"
                className="full-media"
              />
            ) : (
              <video controls className="full-media">
                <source src={selectedMedia.url} type={selectedMedia.type} />
              </video>
            )}
            <div className="button-row">
              <button onClick={closeMediaModal} className="close-btn">
                Close
              </button>
              <button
                className="confirm-btn"
                onClick={() => downloadMedia(selectedMedia.url)}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
