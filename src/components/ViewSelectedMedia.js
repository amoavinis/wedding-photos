import "../css/ViewSelectedMedia.css"
import { downloadWithCloudFunction } from "../services/firebase";

export default function ViewSelectedMedia({ selectedMedia, closeModalFn }) {
  async function downloadMedia(file) {
    await downloadWithCloudFunction(file);
  }

  return (
    <div className="view-modal" onClick={closeModalFn}>
      <div className="view-modal-content" onClick={(e) => e.stopPropagation()}>
        {selectedMedia.type.startsWith("image") ? (
          <img src={selectedMedia.url} alt="Full View" className="full-media" />
        ) : (
          <video controls className="full-media">
            <source src={selectedMedia.url} type={selectedMedia.type} />
          </video>
        )}
        <div className="button-row">
          <button onClick={closeModalFn} className="close-btn">
            Close
          </button>
          <button
            className="confirm-btn"
            onClick={() => downloadMedia(selectedMedia)}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
