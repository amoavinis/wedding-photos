import { useState, useEffect } from "react";
import "./App.css";

export default function EventMediaApp() {
  const [mediaList, setMediaList] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const savedMedia = []//JSON.parse(localStorage.getItem("mediaList")) || [];
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
    const urls = selectedFiles.map((file) => ({ url: URL.createObjectURL(file), type: file.type }));
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
        <button onClick={() => setShowModal(true)} className="upload-btn">Upload</button>
      </div>
      <div className="body">
        <div className="grid grid-cols-2 gap-2 mt-4">
          {mediaList.map((media, index) => (
            <div key={index} onClick={() => openMediaModal(media)} className="preview-item">
              {media.type.startsWith("image") ? (
                <img src={media.url} alt="Uploaded Media" className="preview-img" />
              ) : (
                <div className="video-thumb">▶ Video</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Select photos to upload</h2>
            <button onClick={openFileDialog} className="file-select-btn">Choose Files</button>
            <div className="preview-container">
              {selectedFiles.map((file, index) => (
                <div key={index} className="preview-item">
                  {file.type.startsWith("video") ? (
                    <div className="video-thumb">🎥 Video</div>
                  ) : (
                    <img src={URL.createObjectURL(file)} alt="Preview" className="preview-img" />
                  )}
                  <button className="remove-btn" onClick={() => removeFile(index)}>X</button>
                </div>
              ))}
            </div>
            <button onClick={uploadFiles} className="confirm-btn">Upload</button>
            <button onClick={() => setShowModal(false)} className="close-btn">Close</button>
          </div>
        </div>
      )}

      {selectedMedia && (
        <div className="modal" onClick={closeMediaModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeMediaModal}>X</button>
            {selectedMedia.type.startsWith("image") ? (
              <img src={selectedMedia.url} alt="Full View" className="full-media" />
            ) : (
              <video controls className="full-media">
                <source src={selectedMedia.url} type={selectedMedia.type} />
              </video>
            )}
            <button className="download-btn" onClick={() => downloadMedia(selectedMedia.url)}>Download</button>
          </div>
        </div>
      )}
    </div>
  );
}
