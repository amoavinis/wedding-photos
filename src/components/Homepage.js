import { useEffect, useState } from "react";
import "../css/Homepage.css";

export default function Homepage() {
  const [index, setIndex] = useState(1);
  const images = [1, 2, 3]; // Array of image indices

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev % 3) + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div id="overlay"></div>
      <div className="full-image-container">
        {images.map((imgIndex) => (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img
            key={imgIndex}
            className={`full-image ${index === imgIndex ? "active" : ""}`}
            src={`/assets/image${imgIndex}.jpg`}
          />
        ))}
      </div>
    </>
  );
}
