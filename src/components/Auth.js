import { useEffect, useState } from "react";
import { uploadUser } from "../services/firebase";
import "../css/Auth.css";

export default function Auth({ callbackFn }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUsername("");
  }, []);

  function updateUsername(event) {
    setUsername(event.target.value);
  }

  async function saveUserAndProceed() {
    setLoading(true);
    let res = await uploadUser(username);
    let userObj = { id: res.id, name: username };
    localStorage.setItem("userLoggedIn", JSON.stringify(userObj));
    callbackFn(userObj);
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="login-component">
        <div className="login-text">
          <span>Ανεβάστε τις φωτογραφίες και τις ευχές σας εδώ!</span>
        </div>
        <input
          className="login-input"
          disabled={loading}
          placeholder="Εισάγετε το όνομά σας"
          onKeyUp={updateUsername}
        ></input>
        <button
          className={loading ? "login-button disabled" : "login-button"}
          disabled={loading}
          onClick={saveUserAndProceed}
        >
          Συνέχεια
        </button>
      </div>
    </div>
  );
}
