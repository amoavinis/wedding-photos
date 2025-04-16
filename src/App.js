import { useState, useEffect } from "react";
import "./App.css";
import Auth from "./components/Auth";

export default function EventMediaApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userObjStr = localStorage.getItem("userLoggedIn");
    if (userObjStr) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
    setLoading(false);
  }, []);

  function handleAuthResponse(response) {
    if (response) {
      setIsLoggedIn(true);
    }
  }

  return (
    <div className="h-100">
      <div className="header">
        <div className="title-box">
          <span className="title">Καλώς ήρθατε στο γάμο μας!</span>
        </div>
        {/* <div className="open-modal-box">
          <button
            onClick={() => setShowModal(true)}
            className="open-modal-button"
          >
            Upload
          </button>
        </div> */}
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : isLoggedIn ? (
        <div>User is logged in</div>
      ) : (
        <Auth callbackFn={handleAuthResponse} />
      )}
    </div>
  );
}
