import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import ViewSelectedMedia from "../components/ViewSelectedMedia";
import UserSelector from "../components/UserSelector";
import { fetchPhotos } from "../services/firebase";

export default function AdminPage() {
  const [mediaList, setMediaList] = useState([]);
  const [filteredMediaList, setFilteredMediaList] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    async function loadPhotos(snapshot) {
      let mediaData = await Promise.all(
        snapshot.docs.map(async (doc) => ({
          ...doc.data(),
        }))
      );

      setMediaList(mediaData);
      filterMediaList(mediaData, "");
    }

    const unsubscribe = fetchPhotos(loadPhotos);
    return () => unsubscribe();
  }, []);

  const openMediaModal = (media) => {
    setSelectedMedia({ ...media, url: media.downloadURL, downloadURL: null });
  };

  const closeMediaModal = () => {
    setSelectedMedia(null);
  };

  function filterMediaList(media, username) {
    let filtered = username
      ? media.filter((m) => m.username.startsWith(username))
      : media;
    setFilteredMediaList(filtered);
  }

  function onFilterChange(value) {
    filterMediaList(mediaList, value);
  }

  return (
    <>
      <div className="user-filter">
        <UserSelector updateFn={(x) => onFilterChange(x)} />
      </div>
      <div className="admin-body">
        {filteredMediaList.map((media, index) => (
          <div
            key={index}
            onClick={() => openMediaModal(media)}
            className="preview-item"
            style={{ cursor: "pointer" }}
          >
            {media.type.startsWith("image") ? (
              <img src={media.preview} alt="Uploaded Media" />
            ) : (
              <div className="video-player-play-container">
                <img src={media.preview} alt="Uploaded Media" />
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

      {selectedMedia && (
        <ViewSelectedMedia
          selectedMedia={selectedMedia}
          closeModalFn={closeMediaModal}
        />
      )}
    </>
  );
}
