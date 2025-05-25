import { useEffect, useState } from "react";
import {
  useLocation,
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import "./App.css";
import UploadPage from "./components/UploadPage";
import AdminPage from "./components/AdminPage";
import Homepage from "./components/Homepage";

export default function EventMediaApp() {
  const [showUploadScreen, setShowUploadScreen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <Router>
      <AppContent
        showUploadScreen={showUploadScreen}
        setShowUploadScreen={setShowUploadScreen}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
      />
    </Router>
  );
}

function AppContent({
  showUploadScreen,
  setShowUploadScreen,
  isAdmin,
  setIsAdmin,
}) {
  const location = useLocation();
  const [displayedTitle, setDisplayedTitle] = useState("");
  const fullTitle = "Καλώς ήρθατε στο γάμο μας!";
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (location.pathname.includes("/tzotzotzia")) {
      setIsAdmin(true);
    }
  }, [location.pathname, setIsAdmin]);

  useEffect(() => {
    if (currentIndex < fullTitle.length) {
      const timeout = setTimeout(() => {
        setDisplayedTitle(prev => prev + fullTitle[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 100); // Adjust speed here (100ms per character)

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullTitle]);

  // Reset animation when navigating away and back
  useEffect(() => {
    setDisplayedTitle("");
    setCurrentIndex(0);
  }, [location.pathname]);

  return (
    <div className="h-100">
      <div className={showUploadScreen ? "" : isAdmin ? "header" : "transparent-header"}>
        <div style={{ width: "20%" }}></div>
        <div className="title-box">
          <span className="title">{displayedTitle}</span>
        </div>
        {!showUploadScreen && !isAdmin ? (
          <div className="open-modal-box">
            <button
              onClick={() => setShowUploadScreen(true)}
              className="open-modal-button"
            >
              Ανεβάστε
            </button>
          </div>
        ) : null}
      </div>

      <div className={isAdmin ? "h-85" : "main-body"}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                {showUploadScreen ? (
                  <UploadPage
                    callbackFn={() => {
                      setShowUploadScreen(false);
                    }}
                  />
                ) : (
                  <Homepage />
                )}
              </>
            }
          />
          <Route path="tzotzotzia" element={<AdminPage />} />
        </Routes>
      </div>
    </div>
  );
}