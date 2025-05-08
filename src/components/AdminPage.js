import { useState, useEffect, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faFolder } from "@fortawesome/free-solid-svg-icons";
import ViewSelectedMedia from "../components/ViewSelectedMedia";
import UserSelector from "../components/UserSelector";
import { fetchPhotos, getUserFolders } from "../services/firebase";
import "../css/Admin.css";

export default function AdminPage() {
  const [mediaList, setMediaList] = useState([]);
  const [filteredMediaList, setFilteredMediaList] = useState([]);
  const [foldersList, setFoldersList] = useState([]);
  const [filteredFoldersList, setFilteredFoldersList] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [toggleValue, setToggleValue] = useState(false);
  const effectRan = useRef(false); // Track if effect ran
  const [openFolder, setOpenFolder] = useState(null);
  const [openedWish, setOpenedWish] = useState(0);

  const loadData = useCallback(
    async (showPhotos) => {
      if (showPhotos) {
        if (!mediaList.length) {
          let mediaData = await fetchPhotos();

          setMediaList(mediaData);
          filterMediaList(mediaData, "");
        }
      } else {
        if (!foldersList.length) {
          let foldersData = await getUserFolders();

          setFoldersList(foldersData);
          filterFoldersList(foldersData, "");
        }
      }
    },
    [foldersList, mediaList]
  );

  useEffect(() => {
    if (effectRan.current) return; // Skip duplicate runs
    effectRan.current = true;

    loadData(toggleValue);
  }, [loadData, toggleValue]);

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

  function filterFoldersList(folders, username) {
    let filteredFolders = username
      ? folders.filter((f) => f.name.startsWith(username))
      : folders;

    setFilteredFoldersList(filteredFolders);
  }

  function onFilterChange(value) {
    filterMediaList(mediaList, value);
    filterFoldersList(foldersList, value);
  }

  function handleToggle() {
    let newToggleValue = !toggleValue;
    setToggleValue(newToggleValue);
    loadData(newToggleValue);
  }

  function onClickFolder(folder) {
    setOpenFolder(folder);
  }

  function onCloseFolder() {
    setOpenFolder(null);
  }

  function navigateWishes(nextOrPrevious) {
    if (!openFolder.wishes.length) {
      return;
    }

    let nextIndex = openedWish;
    if (nextOrPrevious === "next") {
      nextIndex = (nextIndex + 1) % openFolder.wishes.length;
    } else if (nextOrPrevious === "previous") {
      nextIndex = (nextIndex - 1) % openFolder.wishes.length;
    }
    setOpenedWish(nextIndex);
  }

  function disabledButtons() {
    return openFolder.wishes?.length <= 1;
  }

  return (
    <>
      {/* Filter */}
      {openFolder ? null : (
        <div className="user-filter">
          <div style={{ width: "50%" }}>
            <UserSelector updateFn={(x) => onFilterChange(x)} />
          </div>
          <div
            style={{
              display: "flex",
              height: "100%",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>Προβολή φακέλων</span>
            <label className="switch">
              <input
                type="checkbox"
                onChange={() => {
                  handleToggle();
                }}
              />
              <span className="slider round"></span>
            </label>
            <span>Προβολή όλων</span>
          </div>
        </div>
      )}

      {/* Show photos */}
      {toggleValue && (
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
      )}

      {/* Show folders */}
      {!toggleValue && !openFolder && (
        <div className="admin-body">
          <div className="folder-list">
            {filteredFoldersList.map((folder, index) => (
              <div
                key={index}
                className="folder"
                onClick={() => onClickFolder(folder)}
              >
                <FontAwesomeIcon
                  icon={faFolder}
                  style={{ color: "black", fontSize: "24px" }}
                />
                <span>{folder.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show folder content */}
      {!toggleValue && openFolder && (
        <div className="folder-contents">
          <div className="folder-name">
            <div>
              <span>Φωτογραφίες και ευχή από:</span>
              <span style={{ marginLeft: 10, fontWeight: "bold" }}>
                {openFolder.name}
              </span>
            </div>
            <button className="folder-X" onClick={() => onCloseFolder()}>
              X
            </button>
          </div>

          <div className="folder-photos">
            {openFolder.media.map((media, index) => (
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

          <div className="wish-container">
            <div className="wish-header">
              <span style={{ fontSize: 16 }}>Ευχή</span>
              <div className="wish-buttons">
                <button
                  className={
                    disabledButtons() ? "wish-button disabled" : "wish-button"
                  }
                  onClick={() => navigateWishes("previous")}
                  disabled={disabledButtons()}
                >
                  {"<"}
                </button>
                <button
                  className={
                    disabledButtons() ? "wish-button disabled" : "wish-button"
                  }
                  onClick={() => navigateWishes("next")}
                  disabled={disabledButtons()}
                >
                  {">"}
                </button>
              </div>
            </div>
            <div className="wish-inner-container">
              <span>{openFolder.wishes?.[openedWish]?.message}</span>
            </div>
          </div>
        </div>
      )}

      {selectedMedia && (
        <ViewSelectedMedia
          selectedMedia={selectedMedia}
          closeModalFn={closeMediaModal}
        />
      )}
    </>
  );
}
