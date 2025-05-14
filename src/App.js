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

  useEffect(() => {
    if (location.pathname.includes("/tzotzotzia")) {
      setIsAdmin(true);
    }
  }, [location.pathname, setIsAdmin]);

  return (
    <div className="h-100">
      <div className="header">
        <div style={{ width: "20%" }}></div>
        <div className="title-box">
          <span className="title">Καλώς ήρθατε στο γάμο μας!</span>
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

      <div className="h-85">
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
