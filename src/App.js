import { useState, useEffect } from "react";
import "./App.css";
import UploadModal from "./components/UploadModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import ViewSelectedMedia from "./components/ViewSelectedMedia";
import UserSelector from "./components/UserSelector";

export default function EventMediaApp() {
  const [mediaList, setMediaList] = useState([]);
  const [filteredMediaList, setFilteredMediaList] = useState([]);
  const [username, setUsername] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const savedMedia = []; //JSON.parse(localStorage.getItem("mediaList")) || [];
    setMediaList(savedMedia);
    setFilteredMediaList(savedMedia);
  }, []);

  function onUpload(urls) {
    const updatedMediaList = [...mediaList, ...urls];
    setMediaList(updatedMediaList);
    filterMediaList(updatedMediaList, username);
    localStorage.setItem("mediaList", JSON.stringify(updatedMediaList));
  }

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

  function filterMediaList(media, username) {
    let filtered = username ? media.filter(
      (m) => m.username.startsWith(username)
    ) : media;
    setFilteredMediaList(filtered);
  }

  function onFilterChange(value) {
    setUsername(value);
    filterMediaList(mediaList, value);
  }

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
      <div className="user-filter">
        <UserSelector updateFn={(x) => onFilterChange(x)} />
      </div>
      <div className="body">
        {filteredMediaList.map((media, index) => (
          <div
            key={index}
            onClick={() => openMediaModal(media)}
            className="preview-item"
            style={{ cursor: "pointer" }}
          >
            {media.type.startsWith("image") ? (
              <img src={media.url} alt="Uploaded Media" />
            ) : (
              <div className="video-player-play-container">
                <video src={media.url} width="100%"></video>
                <div className="video-player-play-circle">
                  <FontAwesomeIcon
                    icon={faPlay}
                    style={{ color: "white", fontSize: "40px" }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <UploadModal
          uploadFn={onUpload}
          closeModalFn={() => setShowModal(false)}
        />
      )}

      {selectedMedia && (
        <ViewSelectedMedia
          selectedMedia={selectedMedia}
          closeModalFn={closeMediaModal}
          downloadFn={(url) => downloadMedia(url)}
        />
      )}
    </div>
  );
}
