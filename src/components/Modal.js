import { useEffect } from "react";
import "../css/Modal.css";

const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handlePopState = () => {
      onClose(); // Close modal when back is pressed
    };

    if (isOpen) {
      // Push a dummy history state when modal opens
      window.history.pushState({ modal: true }, "");

      // Listen for back button
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      // Clean up listener when modal closes or unmounts
      window.removeEventListener("popstate", handlePopState);

      // Important: don't call history.back() here, just leave the state
      // so that if the user closes the modal manually, they are still one "step" deep.
      // This avoids infinite loops.
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">{children}</div>
    </div>
  );
};

export default Modal;
