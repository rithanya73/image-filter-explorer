import { useState } from "react";
import "./App.css";

const kernels = {
  "Mean": [
    [1/9, 1/9, 1/9],
    [1/9, 1/9, 1/9],
    [1/9, 1/9, 1/9],
  ],

  "Mean Filter": [
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
  ],

  "Gaussian Filter": [
    [1 / 16, 2 / 16, 1 / 16],
    [2 / 16, 4 / 16, 2 / 16],
    [1 / 16, 2 / 16, 1 / 16],
  ],

  "Median Filter": [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ],

  "Sobel X": [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ],

  "Sobel Y": [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ],

  "Prewitt X": [
    [-1, 0, 1],
    [-1, 0, 1],
    [-1, 0, 1],
  ],

  "Prewitt Y": [
    [-1, -1, -1],
    [0, 0, 0],
    [1, 1, 1],
  ],

  Laplacian: [
    [0, 1, 0],
    [1, -4, 1],
    [0, 1, 0],
  ],

  Sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ],
};

function App() {
  const [page, setPage] = useState("home");
  const [activeOperator, setActiveOperator] = useState("Sobel");

  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [difference, setDifference] = useState(null);

  const [pixelData, setPixelData] = useState(null);

  const [selectedKernel, setSelectedKernel] =
    useState("Sobel X");

  // =========================
  // UPLOAD IMAGE
  // =========================

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageURL = URL.createObjectURL(file);

    setImage(imageURL);
    setProcessedImage(null);
    setDifference(null);
    setPixelData(null);

    setPage("operators");
  };

  // =========================
  // APPLY EDGE OPERATOR
  // =========================

  const applyOperator = (operator = activeOperator) => {
    if (!image) return;

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      const gray = new Float32Array(width * height);

      // Convert to grayscale
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;

          gray[y * width + x] =
            0.299 * data[i] +
            0.587 * data[i + 1] +
            0.114 * data[i + 2];
        }
      }

      const operatorX = kernels[`${operator} X`];
      const operatorY = kernels[`${operator} Y`];

      const output = new Uint8ClampedArray(
        width * height * 4
      );

      let totalDifference = 0;
      let pixelCount = 0;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let gx = 0;
          let gy = 0;

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixel =
                gray[(y + ky) * width + (x + kx)];

              gx +=
                pixel * operatorX[ky + 1][kx + 1];

              gy +=
                pixel * operatorY[ky + 1][kx + 1];
            }
          }

          const magnitude = Math.sqrt(
            gx * gx + gy * gy
          );

          const value = Math.min(
            255,
            Math.round(magnitude)
          );

          const index = (y * width + x) * 4;

          output[index] = value;
          output[index + 1] = value;
          output[index + 2] = value;
          output[index + 3] = 255;

          totalDifference += Math.abs(
            gray[y * width + x] - value
          );

          pixelCount++;
        }
      }

      const processedData = new ImageData(
        output,
        width,
        height
      );

      ctx.putImageData(processedData, 0, 0);

      setProcessedImage(
        canvas.toDataURL("image/png")
      );

      const percentage =
        (totalDifference /
          (pixelCount * 255)) *
        100;

      setDifference(percentage.toFixed(2));
    };

    img.src = image;
  };

  // =========================
  // APPLY MEAN FILTER
  // =========================

  const applyMeanFilter = () => {
    if (!image) return;

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      const output = new Uint8ClampedArray(
        width * height * 4
      );

      // Preserve border pixels because a 3 × 3
      // neighbourhood is not available there.
      output.set(data);

      let totalDifference = 0;
      let pixelCount = 0;

      // Apply the 3 × 3 mean filter to interior pixels.
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let redSum = 0;
          let greenSum = 0;
          let blueSum = 0;

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const index =
                ((y + ky) * width + (x + kx)) * 4;

              redSum += data[index];
              greenSum += data[index + 1];
              blueSum += data[index + 2];
            }
          }

          const red = Math.round(redSum / 9);
          const green = Math.round(greenSum / 9);
          const blue = Math.round(blueSum / 9);

          const index = (y * width + x) * 4;

          output[index] = red;
          output[index + 1] = green;
          output[index + 2] = blue;
          output[index + 3] = 255;

          totalDifference +=
            (Math.abs(data[index] - red) +
              Math.abs(data[index + 1] - green) +
              Math.abs(data[index + 2] - blue)) / 3;

          pixelCount++;
        }
      }

      const processedData = new ImageData(
        output,
        width,
        height
      );

      ctx.putImageData(processedData, 0, 0);

      setProcessedImage(
        canvas.toDataURL("image/png")
      );

      const percentage =
        (totalDifference / (pixelCount * 255)) * 100;

      setDifference(percentage.toFixed(2));
    };

    img.src = image;
  };

  // =========================
  // APPLY MEDIAN FILTER
  // =========================

  const applyMedianFilter = () => {
    if (!image) return;

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      const output = new Uint8ClampedArray(data);

      let totalDifference = 0;
      let pixelCount = 0;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const reds = [];
          const greens = [];
          const blues = [];

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const index =
                ((y + ky) * width + (x + kx)) * 4;

              reds.push(data[index]);
              greens.push(data[index + 1]);
              blues.push(data[index + 2]);
            }
          }

          reds.sort((a, b) => a - b);
          greens.sort((a, b) => a - b);
          blues.sort((a, b) => a - b);

          const red = reds[4];
          const green = greens[4];
          const blue = blues[4];

          const index = (y * width + x) * 4;

          output[index] = red;
          output[index + 1] = green;
          output[index + 2] = blue;
          output[index + 3] = 255;

          totalDifference +=
            (Math.abs(data[index] - red) +
              Math.abs(data[index + 1] - green) +
              Math.abs(data[index + 2] - blue)) / 3;

          pixelCount++;
        }
      }

      const processedData = new ImageData(
        output,
        width,
        height
      );

      ctx.putImageData(processedData, 0, 0);

      setProcessedImage(canvas.toDataURL("image/png"));

      const percentage = pixelCount
        ? (totalDifference / (pixelCount * 255)) * 100
        : 0;

      setDifference(percentage.toFixed(2));
    };

    img.src = image;
  };

  // =========================
  // APPLY GAUSSIAN FILTER
  // =========================

  const applyGaussianFilter = () => {
    if (!image) return;

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      const output = new Uint8ClampedArray(
        width * height * 4
      );

      // Preserve border pixels because a 3 × 3
      // neighbourhood is not available there.
      output.set(data);

      const kernel = kernels["Gaussian Filter"];

      let totalDifference = 0;
      let pixelCount = 0;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let redSum = 0;
          let greenSum = 0;
          let blueSum = 0;

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const index =
                ((y + ky) * width + (x + kx)) * 4;

              const weight = kernel[ky + 1][kx + 1];

              redSum += data[index] * weight;
              greenSum += data[index + 1] * weight;
              blueSum += data[index + 2] * weight;
            }
          }

          const red = Math.round(redSum);
          const green = Math.round(greenSum);
          const blue = Math.round(blueSum);

          const index = (y * width + x) * 4;

          output[index] = red;
          output[index + 1] = green;
          output[index + 2] = blue;
          output[index + 3] = 255;

          totalDifference +=
            (Math.abs(data[index] - red) +
              Math.abs(data[index + 1] - green) +
              Math.abs(data[index + 2] - blue)) / 3;

          pixelCount++;
        }
      }

      const processedData = new ImageData(
        output,
        width,
        height
      );

      ctx.putImageData(processedData, 0, 0);

      setProcessedImage(
        canvas.toDataURL("image/png")
      );

      const percentage =
        (totalDifference / (pixelCount * 255)) * 100;

      setDifference(percentage.toFixed(2));
    };

    img.src = image;
  };

  const selectOperator = (operator) => {
    setActiveOperator(operator);
    setSelectedKernel(`${operator} X`);
    setProcessedImage(null);
    setDifference(null);
    setPixelData(null);
    setPage(operator.toLowerCase());
  };

  const applySobel = () => applyOperator("Sobel");
  const applyPrewitt = () => applyOperator("Prewitt");

  // =========================
  // PIXEL EXPLORER
  // =========================

  const explorePixel = (event) => {
    if (!image) return;

    const clickedImage = event.currentTarget;

    const rect =
      clickedImage.getBoundingClientRect();

    const naturalWidth =
      clickedImage.naturalWidth;

    const naturalHeight =
      clickedImage.naturalHeight;

    /*
      IMPORTANT:

      The image uses object-fit: contain.

      Therefore the visible image may not
      occupy the complete container.

      We calculate the actual displayed
      image dimensions first.
    */

    const containerRatio =
      rect.width / rect.height;

    const imageRatio =
      naturalWidth / naturalHeight;

    let displayedWidth;
    let displayedHeight;

    let offsetX;
    let offsetY;

    if (imageRatio > containerRatio) {
      // Image is wider than container
      displayedWidth = rect.width;

      displayedHeight =
        rect.width / imageRatio;

      offsetX = 0;

      offsetY =
        (rect.height - displayedHeight) / 2;
    } else {
      // Image is taller than container
      displayedHeight = rect.height;

      displayedWidth =
        rect.height * imageRatio;

      offsetY = 0;

      offsetX =
        (rect.width - displayedWidth) / 2;
    }

    const mouseX =
      event.clientX - rect.left;

    const mouseY =
      event.clientY - rect.top;

    // Check whether click is inside
    // the actual displayed image
    if (
      mouseX < offsetX ||
      mouseX > offsetX + displayedWidth ||
      mouseY < offsetY ||
      mouseY > offsetY + displayedHeight
    ) {
      return;
    }

    // Convert screen position to
    // original image pixel position
    let x = Math.floor(
      ((mouseX - offsetX) /
        displayedWidth) *
        naturalWidth
    );

    let y = Math.floor(
      ((mouseY - offsetY) /
        displayedHeight) *
        naturalHeight
    );

    x = Math.max(
      1,
      Math.min(x, naturalWidth - 2)
    );

    y = Math.max(
      1,
      Math.min(y, naturalHeight - 2)
    );

    // =========================
    // READ IMAGE DATA
    // =========================

    const canvas =
      document.createElement("canvas");

    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      clickedImage,
      0,
      0,
      naturalWidth,
      naturalHeight
    );

    const imageData =
      ctx.getImageData(
        0,
        0,
        naturalWidth,
        naturalHeight
      );

    const data = imageData.data;

    // =========================
    // SELECTED PIXEL
    // =========================

    const centerIndex =
      (y * naturalWidth + x) * 4;

    const r = data[centerIndex];
    const g = data[centerIndex + 1];
    const b = data[centerIndex + 2];

    const gray =
      0.299 * r +
      0.587 * g +
      0.114 * b;

    // =========================
    // 3 × 3 NEIGHBOURHOOD
    // =========================

    const neighbourhood = [];

    for (let ky = -1; ky <= 1; ky++) {
      const row = [];

      for (let kx = -1; kx <= 1; kx++) {
        const nx = x + kx;
        const ny = y + ky;

        const index =
          (ny * naturalWidth + nx) * 4;

        const nr = data[index];
        const ng = data[index + 1];
        const nb = data[index + 2];

        const value =
          0.299 * nr +
          0.587 * ng +
          0.114 * nb;

        row.push(Math.round(value));
      }

      neighbourhood.push(row);
    }

    // =========================
    // SELECTED KERNEL
    // =========================

    const kernel =
      kernels[selectedKernel];

    // =========================
    // PIXEL × KERNEL
    // =========================

    const calculations = [];

    let total = 0;

    for (let ky = 0; ky < 3; ky++) {
      const row = [];

      let rowTotal = 0;

      for (let kx = 0; kx < 3; kx++) {
        const pixel =
          neighbourhood[ky][kx];

        const kernelValue =
          kernel[ky][kx];

        const result =
          pixel * kernelValue;

        row.push({
          pixel,
          kernel: kernelValue,
          result,
        });

        rowTotal += result;
      }

      total += rowTotal;

      calculations.push({
        values: row,
        rowTotal,
      });
    }

    // =========================
    // MEDIAN FILTER CALCULATION
    // =========================

    let medianR = null;
    let medianG = null;
    let medianB = null;
    let medianGray = null;

    if (activeOperator === "Median") {
      const rgbR = [];
      const rgbG = [];
      const rgbB = [];
      const grayValues = [];

      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const nx = x + kx - 1;
          const ny = y + ky - 1;
          const index = (ny * naturalWidth + nx) * 4;

          const nr = data[index];
          const ng = data[index + 1];
          const nb = data[index + 2];

          rgbR.push(nr);
          rgbG.push(ng);
          rgbB.push(nb);
          grayValues.push(
            Math.round(0.299 * nr + 0.587 * ng + 0.114 * nb)
          );
        }
      }

      rgbR.sort((a, b) => a - b);
      rgbG.sort((a, b) => a - b);
      rgbB.sort((a, b) => a - b);
      grayValues.sort((a, b) => a - b);

      medianR = rgbR[4];
      medianG = rgbG[4];
      medianB = rgbB[4];
      medianGray = grayValues[4];
    }

    // =========================
    // ACTIVE OPERATOR GX / GY
    // =========================

    const operatorX =
      kernels[`${activeOperator} X`];

    const operatorY =
      kernels[`${activeOperator} Y`];

    let gx = 0;
    let gy = 0;

    if (operatorX && operatorY) {
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          gx +=
            neighbourhood[ky][kx] *
            operatorX[ky][kx];

          gy +=
            neighbourhood[ky][kx] *
            operatorY[ky][kx];
        }
      }
    }

    const magnitude = Math.sqrt(
      gx * gx + gy * gy
    );

    // =========================
    // SAVE PIXEL DATA
    // =========================

    setPixelData({
      x,
      y,

      r,
      g,
      b,

      gray: Math.round(gray),

      neighbourhood,

      kernel,

      calculations,

      total,

      gx,
      gy,

      magnitude:
        magnitude.toFixed(2),

      medianR,
      medianG,
      medianB,
      medianGray,

      selectedKernel,
    });
  };

  // =========================
  // HOME
  // =========================

  if (page === "home") {
    return (
      <div className="app">

        <nav className="navbar">

          <div
            className="logo"
            onClick={() => setPage("home")}
          >
            <span className="logo-icon">
              ◈
            </span>
            ImageLab
          </div>

          <div className="nav-links">
            <span>Home</span>
            <span>Concepts</span>
            <span>About</span>
          </div>

        </nav>

        <main className="hero">

          <div className="hero-content">

            <p className="tag">
              INTERACTIVE IMAGE PROCESSING
            </p>

            <h1>
              Understand Images.
              <br />
              <span>
                See the Mathematics.
              </span>
            </h1>

            <p className="description">
              Explore spatial domain methods
              and gradient operators through
              interactive image processing.
            </p>

            <div className="buttons">

              <button
                className="primary-btn"
                onClick={() =>
                  setPage("upload")
                }
              >
                Start Exploring →
              </button>

              <button className="secondary-btn">
                Learn the Concepts
              </button>

            </div>

          </div>

          <div className="hero-visual">

            <div className="image-card">

              <div className="grid-image">

                <div className="kernel">

                  <div>-1</div>
                  <div>0</div>
                  <div>1</div>

                  <div>-2</div>
                  <div>0</div>
                  <div>2</div>

                  <div>-1</div>
                  <div>0</div>
                  <div>1</div>

                </div>

              </div>

              <div className="kernel-label">
                SOBEL X KERNEL
              </div>

            </div>

          </div>

        </main>

        <section className="features">

          <div className="feature">
            <div className="feature-number">
              01
            </div>

            <h3>
              Spatial Domain
            </h3>

            <p>
              Explore spatial filtering
              and image enhancement.
            </p>
          </div>

          <div className="feature">
            <div className="feature-number">
              02
            </div>

            <h3>
              Gradient Operators
            </h3>

            <p>
              Understand Sobel, Prewitt,
              Roberts and Laplacian.
            </p>
          </div>

          <div className="feature">
            <div className="feature-number">
              03
            </div>

            <h3>
              Pixel Analysis
            </h3>

            <p>
              See exactly how kernels
              operate on individual pixels.
            </p>
          </div>

        </section>

      </div>
    );
  }

  // =========================
  // UPLOAD
  // =========================

  if (page === "upload") {
    return (
      <div className="app">

        <nav className="navbar">

          <div
            className="logo"
            onClick={() => setPage("home")}
          >
            <span className="logo-icon">
              ◈
            </span>
            ImageLab
          </div>

          <button
            className="back-btn"
            onClick={() => setPage("home")}
          >
            ← Back
          </button>

        </nav>

        <main className="upload-page">

          <div className="upload-content">

            <p className="tag">
              STEP 01
            </p>

            <h1>
              Upload your{" "}
              <span>image.</span>
            </h1>

            <p className="upload-description">
              Start with an image and explore
              how spatial domain methods
              transform it.
            </p>

            <label className="upload-bubble">

              <div className="upload-symbol">
                ↑
              </div>

              <h2>
                Drop your image here
              </h2>

              <p>
                or{" "}
                <strong>
                  browse files
                </strong>
              </p>

              <small>
                PNG · JPG · JPEG
              </small>

              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageUpload}
              />

            </label>

          </div>

        </main>

      </div>
    );
  }

  // =========================
  // OPERATORS
  // =========================

  if (page === "operators") {
    return (
      <div className="app">

        <nav className="navbar">

          <div
            className="logo"
            onClick={() => setPage("home")}
          >
            <span className="logo-icon">
              ◈
            </span>
            ImageLab
          </div>

          <button
            className="back-btn"
            onClick={() =>
              setPage("upload")
            }
          >
            ← Change Image
          </button>

        </nav>

        <main className="operator-page">

          <div className="operator-heading">

            <p className="tag">
              IMAGE PROCESSING
            </p>

            <h1>
              Choose your{" "}
              <span>method.</span>
            </h1>

            <p>
              Select an operation to explore
              how it transforms your image.
            </p>

          </div>

          <div className="selected-image">
            <img
              src={image}
              alt="Selected"
            />
          </div>

          <div className="method-grid">

            <div
              className="method-card"
              onClick={() => {
                setActiveOperator("Mean");
                setSelectedKernel("Mean Filter");
                setProcessedImage(null);
                setDifference(null);
                setPixelData(null);
                setPage("mean");
              }}
            >
              <span>01</span>
              <h3>Mean Filter</h3>
              <p>
                Basic smoothing and
                noise reduction.
              </p>
            </div>

            <div
              className="method-card"
              onClick={() => {
                setActiveOperator("Median");
                setSelectedKernel("Median Filter");
                setProcessedImage(null);
                setDifference(null);
                setPixelData(null);
                setPage("median");
              }}
            >
              <span>02</span>
              <h3>Median Filter</h3>
              <p>
                Removes salt-and-pepper noise.
              </p>
            </div>

            <div
              className="method-card"
              onClick={() => {
                setActiveOperator("Gaussian");
                setSelectedKernel("Gaussian Filter");
                setProcessedImage(null);
                setDifference(null);
                setPixelData(null);
                setPage("gaussian");
              }}
            >
              <span>03</span>
              <h3>Gaussian Filter</h3>
              <p>
                Smooths the image using
                Gaussian weights.
              </p>
            </div>

            <div
              className="method-card gradient"
              onClick={() =>
                selectOperator("Sobel")
              }
            >
              <span>04</span>
              <h3>Sobel Operator</h3>
              <p>
                Detects edges using
                image gradients.
              </p>
            </div>

            <div
              className="method-card gradient"
              onClick={() =>
                selectOperator("Prewitt")
              }
            >
              <span>05</span>
              <h3>Prewitt Operator</h3>
              <p>
                Detects horizontal
                and vertical edges.
              </p>
            </div>

            <div className="method-card gradient">
              <span>06</span>
              <h3>Roberts Operator</h3>
              <p>
                Detects diagonal
                intensity changes.
              </p>
            </div>

            <div className="method-card gradient">
              <span>07</span>
              <h3>Laplacian</h3>
              <p>
                Uses second-order
                derivatives for edges.
              </p>
            </div>

          </div>

        </main>

      </div>
    );
  }

  // =========================
  // MEAN FILTER
  // =========================

  if (page === "mean") {
    return (
      <div className="app">

        <nav className="navbar">

          <div
            className="logo"
            onClick={() => setPage("home")}
          >
            <span className="logo-icon">
              ◈
            </span>
            ImageLab
          </div>

          <button
            className="back-btn"
            onClick={() => setPage("operators")}
          >
            ← Back to Methods
          </button>

        </nav>

        <main className="sobel-page">

          <div className="sobel-heading">

            <p className="tag">
              SPATIAL FILTER · 01
            </p>

            <h1>
              Mean <span>Filter</span>
            </h1>

            <p>
              Smooth the image by replacing each pixel
              with the average of its 3 × 3 neighbourhood.
            </p>

          </div>

          <div className="sobel-content">

            <div className="sobel-image-card">

              <h3>
                Original Image
              </h3>

              <img
                src={image}
                alt="Original"
              />

            </div>

            <div className="kernel-card">

              <h3>
                3 × 3 Mean Kernel
              </h3>

              <div className="sobel-kernel">
                {kernels["Mean Filter"]
                  .flat()
                  .map((value, index) => (
                    <div key={index}>
                      {value.toFixed(2)}
                    </div>
                  ))}
              </div>

              <p>
                Every pixel in the neighbourhood
                has equal weight.
              </p>

            </div>

          </div>

          <button
            className="process-btn"
            onClick={applyMeanFilter}
          >
            Apply Mean Filter →
          </button>

          {processedImage && (
            <>

              <div className="result-section">

                <div className="result-card">

                  <h3>
                    Processed Image
                  </h3>

                  <img
                    src={processedImage}
                    alt="Mean filtered result"
                  />

                </div>

                <div className="analysis-card">

                  <div className="difference">
                    <span>
                      IMAGE DIFFERENCE
                    </span>

                    <strong>
                      {difference}%
                    </strong>
                  </div>

                  <h3>
                    What happened?
                  </h3>

                  <p>
                    The mean filter takes the nine pixels
                    in a 3 × 3 neighbourhood and calculates
                    their average.
                  </p>

                  <p>
                    The average replaces the centre pixel,
                    reducing sudden intensity changes and
                    making the image smoother.
                  </p>

                  <p>
                    Since every kernel value is 1/9, all
                    nine pixels contribute equally to the
                    output.
                  </p>

                </div>

              </div>

              <div className="kernel-info">

                <div className="gradient-card">
                  <h3>
                    Mean <span>Calculation</span>
                  </h3>

                  <div className="formula">
                    Output = Σ(9 Neighbour Pixels) ÷ 9
                  </div>
                </div>

                <div className="gradient-card">
                  <h3>
                    Kernel <span>Matrix</span>
                  </h3>

                  <div className="gradient-kernel">
                    {kernels["Mean Filter"]
                      .flat()
                      .map((value, index) => (
                        <div key={index}>
                          {value.toFixed(2)}
                        </div>
                      ))}
                  </div>
                </div>

              </div>

            </>
          )}

        </main>

      </div>
    );
  }

  // =========================
  // MEDIAN FILTER
  // =========================

  if (page === "median") {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="logo" onClick={() => setPage("home")}>
            <span className="logo-icon">◈</span>
            ImageLab
          </div>

          <button
            className="back-btn"
            onClick={() => setPage("operators")}
          >
            ← Back to Methods
          </button>
        </nav>

        <main className="sobel-page">
          <div className="sobel-heading">
            <p className="tag">SPATIAL FILTER · 02</p>
            <h1>Median <span>Filter</span></h1>
            <p>
              Reduce impulse noise by replacing each pixel
              with the median value of its 3 × 3 neighbourhood.
            </p>
          </div>

          <div className="sobel-content">
            <div className="sobel-image-card">
              <h3>Original Image</h3>
              <img src={image} alt="Original" />
            </div>

            <div className="kernel-card">
              <h3>3 × 3 Median Window</h3>
              <div className="sobel-kernel">
                {Array.from({ length: 9 }, (_, index) => (
                  <div key={index}>1</div>
                ))}
              </div>
              <p>
                The nine values are sorted independently for each
                colour channel. The middle value replaces the centre pixel.
              </p>
            </div>
          </div>

          <button
            className="process-btn"
            onClick={applyMedianFilter}
          >
            Apply Median Filter →
          </button>

          {processedImage && (
            <>
              <div className="result-section">
                <div className="result-card">
                  <h3>Processed Image</h3>
                  <img src={processedImage} alt="Median filtered result" />
                </div>

                <div className="analysis-card">
                  <div className="difference">
                    <span>IMAGE DIFFERENCE</span>
                    <strong>{difference}%</strong>
                  </div>

                  <h3>What happened?</h3>
                  <p>
                    The median filter collects the nine neighbouring
                    pixel values and sorts them.
                  </p>
                  <p>
                    The fifth value, which is the median, becomes the
                    new centre-pixel value.
                  </p>
                  <p>
                    This is especially effective at removing isolated
                    salt-and-pepper noise while preserving edges better
                    than a simple averaging filter.
                  </p>
                </div>
              </div>

              <div className="kernel-info">
                <div className="gradient-card">
                  <h3>Median <span>Selection</span></h3>
                  <div className="formula">
                    Sort 9 values → select the 5th value
                  </div>
                </div>

                <div className="gradient-card">
                  <h3>3 × 3 <span>Window</span></h3>
                  <div className="gradient-kernel">
                    {Array.from({ length: 9 }, (_, index) => (
                      <div key={index}>1</div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                className="pixel-explore-btn"
                onClick={() => {
                  setSelectedKernel("Median Filter");
                  setPixelData(null);
                  setPage("pixels");
                }}
              >
                🔍 Explore Pixels
              </button>
            </>
          )}
        </main>
      </div>
    );
  }

  // =========================
  // GAUSSIAN FILTER
  // =========================

  if (page === "gaussian") {
    return (
      <div className="app">

        <nav className="navbar">

          <div
            className="logo"
            onClick={() => setPage("home")}
          >
            <span className="logo-icon">
              ◈
            </span>
            ImageLab
          </div>

          <button
            className="back-btn"
            onClick={() => setPage("operators")}
          >
            ← Back to Methods
          </button>

        </nav>

        <main className="sobel-page">

          <div className="sobel-heading">

            <p className="tag">
              SPATIAL FILTER · 03
            </p>

            <h1>
              Gaussian <span>Filter</span>
            </h1>

            <p>
              Smooth the image using a weighted 3 × 3
              neighbourhood, giving the centre pixels
              greater influence.
            </p>

          </div>

          <div className="sobel-content">

            <div className="sobel-image-card">

              <h3>
                Original Image
              </h3>

              <img
                src={image}
                alt="Original"
              />

            </div>

            <div className="kernel-card">

              <h3>
                3 × 3 Gaussian Kernel
              </h3>

              <div className="sobel-kernel">
                {kernels["Gaussian Filter"]
                  .flat()
                  .map((value, index) => (
                    <div key={index}>
                      {value.toFixed(4)}
                    </div>
                  ))}
              </div>

              <p>
                The kernel is normalized by 1/16.
                The centre pixel has the highest weight.
              </p>

            </div>

          </div>

          <button
            className="process-btn"
            onClick={applyGaussianFilter}
          >
            Apply Gaussian Filter →
          </button>

          {processedImage && (
            <>

              <div className="result-section">

                <div className="result-card">

                  <h3>
                    Processed Image
                  </h3>

                  <img
                    src={processedImage}
                    alt="Gaussian filtered result"
                  />

                </div>

                <div className="analysis-card">

                  <div className="difference">
                    <span>
                      IMAGE DIFFERENCE
                    </span>

                    <strong>
                      {difference}%
                    </strong>
                  </div>

                  <h3>
                    What happened?
                  </h3>

                  <p>
                    The Gaussian filter replaces each pixel
                    with a weighted average of its 3 × 3
                    neighbourhood.
                  </p>

                  <p>
                    Pixels closer to the centre receive more
                    weight, producing a smoother and more
                    natural blur than a simple mean filter.
                  </p>

                  <p>
                    The kernel weights add up to 1, so the
                    brightness of the image is preserved while
                    high-frequency noise and detail are reduced.
                  </p>

                </div>

              </div>

              <div className="kernel-info">

                <div className="gradient-card">
                  <h3>
                    Gaussian <span>Weights</span>
                  </h3>

                  <div className="formula">
                    1/16 × [1 2 1; 2 4 2; 1 2 1]
                  </div>
                </div>

                <div className="gradient-card">
                  <h3>
                    Kernel <span>Matrix</span>
                  </h3>

                  <div className="gradient-kernel">
                    {kernels["Gaussian Filter"]
                      .flat()
                      .map((value, index) => (
                        <div key={index}>
                          {value.toFixed(4)}
                        </div>
                      ))}
                  </div>
                </div>

              </div>

              <button
                className="pixel-explore-btn"
                onClick={() => {
                  setSelectedKernel("Gaussian Filter");
                  setPixelData(null);
                  setPage("pixels");
                }}
              >
                🔍 Explore Pixels
              </button>

            </>
          )}

        </main>

      </div>
    );
  }

  // =========================
  // EDGE OPERATOR
  // =========================

  if (page === "sobel" || page === "prewitt") {
    const operatorX = kernels[`${activeOperator} X`];
    const operatorY = kernels[`${activeOperator} Y`];
    const operatorNumber = activeOperator === "Sobel" ? "04" : "05";

    return (
      <div className="app">

        <nav className="navbar">

          <div
            className="logo"
            onClick={() => setPage("home")}
          >
            <span className="logo-icon">
              ◈
            </span>
            ImageLab
          </div>

          <button
            className="back-btn"
            onClick={() =>
              setPage("operators")
            }
          >
            ← Back to Methods
          </button>

        </nav>

        <main className="sobel-page">

          <div className="sobel-heading">

            <p className="tag">
              GRADIENT OPERATOR · {operatorNumber}
            </p>

            <h1>
              {activeOperator}{" "}
              <span>Operator</span>
            </h1>

            <p>
              Detect edges by measuring
              intensity changes in horizontal
              and vertical directions.
            </p>

          </div>

          <div className="sobel-content">

            <div className="sobel-image-card">

              <h3>
                Original Image
              </h3>

              <img
                src={image}
                alt="Original"
              />

            </div>

            <div className="kernel-card">

              <h3>
                {activeOperator} X Kernel
              </h3>

              <div className="sobel-kernel">
                {operatorX
                  .flat()
                  .map((value, index) => (
                    <div key={index}>
                      {value}
                    </div>
                  ))}
              </div>

              <p>
                Measures intensity changes
                along the X direction.
              </p>

            </div>

          </div>

          <button
            className="process-btn"
            onClick={
              activeOperator === "Sobel"
                ? applySobel
                : applyPrewitt
            }
          >
            Apply {activeOperator} →
          </button>

          {processedImage && (
            <>

              <div className="result-section">

                <div className="result-card">
                  <h3>
                    Processed Image
                  </h3>

                  <img
                    src={processedImage}
                    alt="Processed"
                  />
                </div>

                <div className="analysis-card">
                  <div className="difference">
                    <span>
                      IMAGE DIFFERENCE
                    </span>

                    <strong>
                      {difference}%
                    </strong>
                  </div>

                  <h3>
                    What happened?
                  </h3>

                  <p>
                    The {activeOperator} operator examines
                    neighbouring pixels and detects
                    changes in image intensity.
                  </p>

                  <p>
                    Strong intensity changes become
                    bright pixels in the processed image,
                    revealing object boundaries and edges.
                  </p>
                </div>

              </div>

              <div className="kernel-info">

                <div className="gradient-card">
                  <h3>
                    {activeOperator}{" "}
                    <span>Gx</span>
                  </h3>

                  <div className="gradient-kernel">
                    {operatorX
                      .flat()
                      .map((value, index) => (
                        <div key={index}>
                          {value}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="gradient-card">
                  <h3>
                    {activeOperator}{" "}
                    <span>Gy</span>
                  </h3>

                  <div className="gradient-kernel">
                    {operatorY
                      .flat()
                      .map((value, index) => (
                        <div key={index}>
                          {value}
                        </div>
                      ))}
                  </div>
                </div>

              </div>

              <div className="formula-card">
                <span>
                  GRADIENT MAGNITUDE
                </span>

                <div className="formula">
                  √(Gx² + Gy²)
                </div>
              </div>

              <button
                className="pixel-explore-btn"
                onClick={() =>
                  setPage("pixels")
                }
              >
                🔍 Explore Pixels
              </button>

            </>
          )}

        </main>

      </div>
    );
  }

  // =========================
  // PIXEL EXPLORER
  // =========================

  if (page === "pixels") {
    return (
      <div className="app">

        <nav className="navbar">

          <div
            className="logo"
            onClick={() => setPage("home")}
          >
            <span className="logo-icon">
              ◈
            </span>
            ImageLab
          </div>

          <button
            className="back-btn"
            onClick={() =>
              setPage(activeOperator.toLowerCase())
            }
          >
            ← Back to {activeOperator}
          </button>

        </nav>

        <main className="pixel-page">

          <div className="pixel-heading">

            <p className="tag">
              INTERACTIVE PIXEL ANALYSIS
            </p>

            <h1>
              Explore{" "}
              <span>Pixels.</span>
            </h1>

            <p>
              Click a pixel and see exactly how
              the kernel processes its surrounding
              3 × 3 neighbourhood.
            </p>

          </div>

          <div className="pixel-layout">

            {/* IMAGE CARD */}

            <div className="pixel-image-card">

              <h3>
                Click any pixel
              </h3>

              {/* 
                IMPORTANT:
                The container is now only a
                viewing area. The image keeps
                its natural aspect ratio.
              */}

              <div className="pixel-image-container">

                <img
                  src={image}
                  alt="Pixel exploration"
                  onClick={explorePixel}
                  draggable="false"
                />

              </div>

              <p className="pixel-hint">
                Click anywhere on the image
                to inspect its pixels.
              </p>

            </div>

            {/* INFORMATION CARD */}

            <div className="pixel-info-card">

              {!pixelData ? (

                <div className="pixel-empty">

                  <div className="pixel-empty-icon">
                    ✦
                  </div>

                  <h3>
                    Select a pixel
                  </h3>

                  <p>
                    Click directly on the image
                    to see its pixel values and
                    kernel calculation.
                  </p>

                </div>

              ) : (

                <>

                  <div className="coordinate-box">

                    <span>
                      SELECTED PIXEL
                    </span>

                    <strong>
                      ({pixelData.x},{" "}
                      {pixelData.y})
                    </strong>

                  </div>

                  <div className="pixel-values">

                    <div>
                      <span>R</span>
                      <strong>
                        {pixelData.r}
                      </strong>
                    </div>

                    <div>
                      <span>G</span>
                      <strong>
                        {pixelData.g}
                      </strong>
                    </div>

                    <div>
                      <span>B</span>
                      <strong>
                        {pixelData.b}
                      </strong>
                    </div>

                    <div>
                      <span>GRAY</span>
                      <strong>
                        {pixelData.gray}
                      </strong>
                    </div>

                  </div>

                  <div className="kernel-selector">

                    <label>
                      SELECT KERNEL
                    </label>

                    <select
                      value={selectedKernel}
                      onChange={(e) => {

                        setSelectedKernel(
                          e.target.value
                        );

                        setPixelData(null);

                      }}
                    >

                      {activeOperator === "Gaussian" ? (
                        <option value="Gaussian Filter">
                          Gaussian Filter
                        </option>
                      ) : activeOperator === "Mean" ? (
                        <option value="Mean Filter">
                          Mean Filter
                        </option>
                      ) : activeOperator === "Median" ? (
                        <option value="Median Filter">
                          Median Filter
                        </option>
                      ) : (
                        <>
                          <option>
                            {activeOperator} X
                          </option>

                          <option>
                            {activeOperator} Y
                          </option>

                          <option>
                            Laplacian
                          </option>

                          <option>
                            Sharpen
                          </option>
                        </>
                      )}

                    </select>

                  </div>

                  <h3>
                    3 × 3 Pixel Neighbourhood
                  </h3>

                  <div className="neighbourhood">

                    {pixelData.neighbourhood
                      .flat()
                      .map(
                        (value, index) => (

                          <div
                            key={index}
                            className={
                              index === 4
                                ? "center-pixel"
                                : ""
                            }
                          >
                            {value}
                          </div>

                        )
                      )}

                  </div>

                  {pixelData.selectedKernel !== "Median Filter" && (
                    <>
                      <h3>
                        Pixel × Kernel
                      </h3>

                      <div className="calculation-grid">

                    {pixelData.calculations.map(
                      (row, rowIndex) => (

                        <div
                          className="calculation-row"
                          key={rowIndex}
                        >

                          {row.values.map(
                            (
                              item,
                              index
                            ) => (

                              <div
                                className="calculation-item"
                                key={index}
                              >

                                <span>
                                  {item.pixel}
                                </span>

                                <small>
                                  ×
                                </small>

                                <span>
                                  {item.kernel}
                                </span>

                                <small>
                                  =
                                </small>

                                <strong>
                                  {item.result}
                                </strong>

                              </div>

                            )
                          )}

                        </div>

                      )
                    )}

                  </div>

                  <div className="calculation-total">

                    <span>
                      KERNEL OUTPUT
                    </span>

                    <strong>
                      {pixelData.total}
                    </strong>

                  </div>
                    </>
                  )}

                  {pixelData.selectedKernel === "Median Filter" && (
                    <div className="gradient-values">
                      <div>
                        <span>MEDIAN R</span>
                        <strong>{pixelData.medianR}</strong>
                      </div>
                      <div>
                        <span>MEDIAN G</span>
                        <strong>{pixelData.medianG}</strong>
                      </div>
                      <div>
                        <span>MEDIAN B</span>
                        <strong>{pixelData.medianB}</strong>
                      </div>
                    </div>
                  )}

                  <h3>
                    Kernel Matrix
                  </h3>

                  {pixelData.selectedKernel === "Median Filter" ? (
                    <div className="kernel-display">
                      {pixelData.neighbourhood
                        .flat()
                        .slice()
                        .sort((a, b) => a - b)
                        .map((value, index) => (
                          <div
                            key={index}
                            className={index === 4 ? "center-pixel" : ""}
                          >
                            {value}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="kernel-display">
                      {pixelData.kernel
                        .flat()
                        .map((value, index) => (
                          <div key={index}>
                            {value}
                          </div>
                        ))}
                    </div>
                  )}

                  {(pixelData.selectedKernel === "Mean" ||
                    pixelData.selectedKernel === "Mean Filter" ||
                    pixelData.selectedKernel === "Gaussian Filter" ||
                    pixelData.selectedKernel === "Median Filter") ? (
                    <div className="pixel-explanation">
                      <strong>
                        {pixelData.selectedKernel === "Gaussian Filter"
                          ? "Gaussian Filter Result"
                          : pixelData.selectedKernel === "Median Filter"
                            ? "Median Filter Result"
                            : "Mean Filter Result"}
                      </strong>
                      <p>
                        {pixelData.selectedKernel === "Gaussian Filter"
                          ? "The nine pixels in the 3 × 3 neighbourhood are multiplied by Gaussian weights. The centre pixel has the highest weight, and all weighted contributions are added to produce the smoothed output."
                          : pixelData.selectedKernel === "Median Filter"
                            ? "The nine neighbouring values are sorted. The fifth value is the median and becomes the filtered value, which helps remove isolated noise without averaging across edges."
                            : "The nine pixels in the 3 × 3 neighbourhood are each multiplied by 1/9 and then added together. The total is the averaged output for the selected pixel."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <h3>
                        Gradient Analysis
                      </h3>

                      <div className="gradient-values">

                    <div>
                      <span>
                        Gx
                      </span>

                      <strong>
                        {pixelData.gx.toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Gy
                      </span>

                      <strong>
                        {pixelData.gy.toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Magnitude
                      </span>

                      <strong>
                        {pixelData.magnitude}
                      </strong>
                    </div>

                      </div>
                    </>
                  )}

                  <div className="pixel-explanation">

                    <strong>
                      What happened?
                    </strong>

                    <p>
                      The selected pixel is
                      surrounded by eight
                      neighbouring pixels,
                      forming a 3 × 3 region.
                    </p>

                    <p>
                      The selected operation is applied to the
                      3 × 3 neighbourhood around the pixel.
                    </p>

                    {activeOperator === "Median" ? (
                      <p>
                        For Median Filter, the nine values are sorted
                        and the fifth value is selected as the output.
                      </p>
                    ) : (
                      <>
                        <p>
                          The selected kernel is placed over this region.
                          Each pixel value is multiplied by the corresponding
                          kernel value.
                        </p>

                        <p>
                          All the multiplication results are added together.
                          This gives the output value for that pixel.
                        </p>
                      </>
                    )}

                    {activeOperator !== "Mean" &&
                      activeOperator !== "Gaussian" && (
                        <p>
                          In {activeOperator} processing, Gx and Gy
                          represent intensity changes in
                          horizontal and vertical directions.
                          A larger gradient magnitude indicates
                          a stronger edge.
                        </p>
                    )}

                    {(activeOperator === "Mean" ||
                      activeOperator === "Gaussian") && (
                        <p>
                          The selected filter combines the surrounding
                          pixels using its kernel weights to produce
                          the output value for the selected pixel.
                        </p>
                    )}

                  </div>

                </>

              )}

            </div>

          </div>

        </main>

      </div>
    );
  }

  return null;
}

export default App;