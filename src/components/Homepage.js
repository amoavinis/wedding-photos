import { useEffect } from "react";
import "../css/Homepage.css";

export default function Homepage() {
  useEffect(() => {
    // Force the browser to load images immediately
    [1, 2, 3].forEach(i => {
      const img = new Image();
      img.src = `/assets/image${i}.jpg`;
    });
  }, []);

  return (
    <>
      <div id="overlay"></div>
      <div className="crossfade-container">
        <img
          src={`/assets/image1.jpg`}
          className="crossfade-image"
          style={{ animationDelay: '0s' }}
          alt="Img 1"
        />
        <img
          src={`/assets/image2.jpg`}
          className="crossfade-image"
          style={{ animationDelay: '4s' }}
          alt="Img 2"
        />
        <img
          src={`/assets/image3.jpg`}
          className="crossfade-image"
          style={{ animationDelay: '8s' }}
          alt="Img 3"
        />
      </div>
    </>
  );
}