import "../App.css";

export default function ViewSelectedMedia({
  selectedMedia,
  closeModalFn,
  downloadFn,
}) {
  return (
    <div className="modal" onClick={closeModalFn}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
            onClick={() => downloadFn(selectedMedia.url)}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
