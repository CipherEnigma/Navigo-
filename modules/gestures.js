export function initializeGestures() {
    // Get references to video and canvas elements
    const videoElement = document.querySelector('.input_video');
    const canvasElement = document.querySelector('.output_canvas');
    const canvasCtx = canvasElement.getContext('2d');
  
    // Initialize the face mesh model
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
  
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  
    // Track last positions for gesture recognition
    const lastPositions = [];
    const maxPositions = 10;
  
    // Function to handle the results from the face mesh model
    function onResults(results) {
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        return;
      }
  
      const landmarks = results.multiFaceLandmarks[0];
      const noseTip = landmarks[1]; // Nose tip landmark
  
      lastPositions.push(noseTip);
      if (lastPositions.length > maxPositions) {
        lastPositions.shift();
      }
  
      if (lastPositions.length === maxPositions) {
        const dx = lastPositions[maxPositions - 1].x - lastPositions[0].x;
        const dy = lastPositions[maxPositions - 1].y - lastPositions[0].y;
  
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0.05) {
            console.log('Shaking head right');
            // Add your gesture handling logic here
          } else if (dx < -0.05) {
            console.log('Shaking head left');
            // Add your gesture handling logic here
          }
        } else {
          if (dy > 0.05) {
            console.log('Nodding head down');
            // Add your gesture handling logic here
          } else if (dy < -0.05) {
            console.log('Nodding head up');
            // Add your gesture handling logic here
          }
        }
      }
    }
  
    // Set up the face mesh model to use the onResults function
    faceMesh.onResults(onResults);
  
    // Set up the camera to use the video element
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await faceMesh.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });
  
    camera.start();
  }