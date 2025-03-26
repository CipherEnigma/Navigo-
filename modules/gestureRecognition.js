class GestureRecognition {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        this.isInitialized = false;
        this.isActive = false;
        this.gestureCallbacks = new Map();
        this.lastGesture = null;
        this.gestureThreshold = 30; // frames to confirm gesture
        this.gestureCounter = 0;
        
        // Load MediaPipe Hands
        this.loadMediaPipeHands();
    }

    async loadMediaPipeHands() {
        try {
            // Load MediaPipe Hands from CDN
            if (typeof Hands === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
                await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
                await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
                await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
            }

            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults(this.onResults.bind(this));
            this.isInitialized = true;
            console.log('MediaPipe Hands initialized successfully');
        } catch (error) {
            console.error('Failed to load MediaPipe Hands:', error);
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async startGestureRecognition() {
        if (!this.isInitialized) {
            console.error('MediaPipe Hands not initialized');
            return false;
        }

        try {
            // Create video element for camera feed
            this.videoElement = document.createElement('video');
            this.videoElement.style.display = 'none';
            document.body.appendChild(this.videoElement);

            // Create canvas for visualization (optional)
            this.canvasElement = document.createElement('canvas');
            this.canvasElement.style.position = 'fixed';
            this.canvasElement.style.top = '10px';
            this.canvasElement.style.right = '10px';
            this.canvasElement.style.width = '320px';
            this.canvasElement.style.height = '240px';
            this.canvasElement.style.zIndex = '10000';
            this.canvasElement.style.border = '2px solid #00ff00';
            this.canvasElement.style.borderRadius = '8px';
            this.canvasElement.width = 320;
            this.canvasElement.height = 240;
            document.body.appendChild(this.canvasElement);

            this.canvasCtx = this.canvasElement.getContext('2d');

            // Initialize camera
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    if (this.isActive) {
                        await this.hands.send({ image: this.videoElement });
                    }
                },
                width: 640,
                height: 480
            });

            await this.camera.start();
            this.isActive = true;
            console.log('Gesture recognition started');
            return true;
        } catch (error) {
            console.error('Failed to start gesture recognition:', error);
            return false;
        }
    }

    stopGestureRecognition() {
        this.isActive = false;
        
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }

        if (this.videoElement) {
            this.videoElement.remove();
            this.videoElement = null;
        }

        if (this.canvasElement) {
            this.canvasElement.remove();
            this.canvasElement = null;
        }

        console.log('Gesture recognition stopped');
    }

    onResults(results) {
        if (!this.canvasCtx) return;

        // Clear canvas
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        // Draw video frame
        this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                this.drawLandmarks(this.canvasCtx, landmarks);
                
                // Recognize gesture
                const gesture = this.recognizeGesture(landmarks);
                this.processGesture(gesture);
            }
        }
    }

    drawLandmarks(ctx, landmarks) {
        // Draw hand landmarks
        ctx.fillStyle = '#FF0000';
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;

        for (const landmark of landmarks) {
            const x = landmark.x * this.canvasElement.width;
            const y = landmark.y * this.canvasElement.height;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17] // Palm
        ];

        ctx.beginPath();
        for (const [start, end] of connections) {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            ctx.moveTo(
                startPoint.x * this.canvasElement.width,
                startPoint.y * this.canvasElement.height
            );
            ctx.lineTo(
                endPoint.x * this.canvasElement.width,
                endPoint.y * this.canvasElement.height
            );
        }
        ctx.stroke();
    }

    recognizeGesture(landmarks) {
        // Get landmark positions
        const thumb_tip = landmarks[4];
        const thumb_ip = landmarks[3];
        const index_tip = landmarks[8];
        const index_pip = landmarks[6];
        const middle_tip = landmarks[12];
        const middle_pip = landmarks[10];
        const ring_tip = landmarks[16];
        const ring_pip = landmarks[14];
        const pinky_tip = landmarks[20];
        const pinky_pip = landmarks[18];
        const wrist = landmarks[0];

        // Calculate finger states (extended or not)
        const thumb_extended = thumb_tip.x > thumb_ip.x; // Simplified for thumb
        const index_extended = index_tip.y < index_pip.y;
        const middle_extended = middle_tip.y < middle_pip.y;
        const ring_extended = ring_tip.y < ring_pip.y;
        const pinky_extended = pinky_tip.y < pinky_pip.y;

        // Recognize specific gestures
        if (index_extended && !middle_extended && !ring_extended && !pinky_extended) {
            return 'point'; // Pointing gesture
        } else if (index_extended && middle_extended && !ring_extended && !pinky_extended) {
            return 'peace'; // Peace sign / Two fingers
        } else if (!index_extended && !middle_extended && !ring_extended && !pinky_extended && thumb_extended) {
            return 'thumbs_up'; // Thumbs up
        } else if (index_extended && middle_extended && ring_extended && pinky_extended && thumb_extended) {
            return 'open_hand'; // Open hand
        } else if (!index_extended && !middle_extended && !ring_extended && !pinky_extended && !thumb_extended) {
            return 'fist'; // Closed fist
        } else if (index_extended && !middle_extended && !ring_extended && pinky_extended) {
            return 'rock'; // Rock and roll sign
        }

        return 'unknown';
    }

    processGesture(gesture) {
        if (gesture === this.lastGesture && gesture !== 'unknown') {
            this.gestureCounter++;
            
            if (this.gestureCounter >= this.gestureThreshold) {
                this.executeGesture(gesture);
                this.gestureCounter = 0;
            }
        } else {
            this.lastGesture = gesture;
            this.gestureCounter = 0;
        }
    }

    executeGesture(gesture) {
        console.log('Executing gesture:', gesture);
        
        // Map gestures to actions
        const gestureActions = {
            'point': () => this.triggerCallback('click'),
            'peace': () => this.triggerCallback('scroll_up'),
            'fist': () => this.triggerCallback('scroll_down'),
            'open_hand': () => this.triggerCallback('go_back'),
            'thumbs_up': () => this.triggerCallback('go_forward'),
            'rock': () => this.triggerCallback('refresh')
        };

        if (gestureActions[gesture]) {
            gestureActions[gesture]();
        }
    }

    registerGestureCallback(gesture, callback) {
        this.gestureCallbacks.set(gesture, callback);
    }

    triggerCallback(action) {
        if (this.gestureCallbacks.has(action)) {
            this.gestureCallbacks.get(action)();
        } else {
            // Send message to content script
            window.postMessage({
                type: 'GESTURE_ACTION',
                action: action
            }, '*');
        }
    }
}

// Export for use in other modules
window.GestureRecognition = GestureRecognition;
