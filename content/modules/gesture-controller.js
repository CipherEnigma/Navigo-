class GestureController {
    constructor() {
        this.isActive = false;
        this.detectionInterval = null;
        this.hands = null;
    }

    async toggle(state) {
        console.log('Gesture toggle:', state);
        if (state) {
            await this.start();
        } else {
            this.stop();
        }
    }

    async start() {
        try {
            console.log('Starting gesture recognition...');
            
            // Clean up first
            this.cleanupCamera();
            
            // Setup camera
            const video = await this.setupCamera();
            console.log('Camera setup complete');
            
            // Load MediaPipe
            await this.loadMediaPipe();
            console.log('MediaPipe loaded');
            
            // Start detection
            await this.startDetection(video);
            
            this.isActive = true;
            this.showFeedback('✅ Gestures activated');
            
        } catch (error) {
            console.error('Gesture start failed:', error);
            this.showFeedback('❌ Gesture failed: ' + error.message);
            throw error;
        }
    }

    async setupCamera() {
        console.log('Setting up camera...');
        
        const video = document.createElement('video');
        video.id = 'gesture-camera';
        video.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; width: 200px; height: 150px;
            border: 3px solid #4CAF50; border-radius: 8px; transform: scaleX(-1);
            z-index: 999998; background: #000;
        `;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 320 }, 
                    height: { ideal: 240 }, 
                    facingMode: 'user' 
                }
            });
            
            console.log('Camera stream obtained');
            video.srcObject = stream;
            document.body.appendChild(video);
            
            return new Promise((resolve, reject) => {
                video.onloadedmetadata = () => {
                    console.log('Video metadata loaded');
                    video.play()
                        .then(() => {
                            console.log('Video playing');
                            resolve(video);
                        })
                        .catch(reject);
                };
                
                video.onerror = () => {
                    reject(new Error('Video load failed'));
                };
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    if (video.readyState < 2) {
                        reject(new Error('Camera timeout'));
                    }
                }, 5000);
            });
            
        } catch (error) {
            console.error('Camera access failed:', error);
            throw new Error('Camera access denied');
        }
    }

    async loadMediaPipe() {
        if (window.Hands) {
            console.log('MediaPipe already loaded');
            return;
        }
        
        console.log('Loading MediaPipe...');
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js';
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
                console.log('MediaPipe script loaded');
                if (window.Hands) {
                    resolve();
                } else {
                    reject(new Error('MediaPipe Hands not available'));
                }
            };
            
            script.onerror = () => {
                reject(new Error('MediaPipe script failed to load'));
            };
            
            document.head.appendChild(script);
        });
    }

    async startDetection(video) {
        console.log('Starting detection...');
        
        this.hands = new window.Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5,
            staticImageMode: false
        });

        this.hands.onResults(results => this.processResults(results));

        // Simple detection loop
        this.detectionInterval = setInterval(() => {
            if (this.isActive && video.videoWidth > 0) {
                this.hands.send({ image: video });
            }
        }, 100);
        
        console.log('Detection loop started');
    }

    processResults(results) {
        if (!results.multiHandLandmarks?.length) return;
        
        const gesture = this.recognizeGesture(results.multiHandLandmarks[0]);
        if (gesture) {
            this.handleGesture(gesture);
        }
    }

    recognizeGesture(landmarks) {
        const indexTip = landmarks[8];
        const indexPIP = landmarks[6];
        const wrist = landmarks[0];

        const indexUp = indexTip.y < indexPIP.y - 0.08;
        
        if (indexUp) {
            if (indexTip.y < 0.3) return 'scroll_up';
            if (indexTip.y > 0.7) return 'scroll_down';
            if (indexTip.x < wrist.x - 0.15) return 'go_back';
            if (indexTip.x > wrist.x + 0.15) return 'go_forward';
        }
        
        return null;
    }

    handleGesture(gesture) {
        const actions = {
            'scroll_up': () => {
                window.scrollBy({ top: -300, behavior: 'smooth' });
                this.showFeedback('☝️ Scroll Up');
            },
            'scroll_down': () => {
                window.scrollBy({ top: 300, behavior: 'smooth' });
                this.showFeedback('👇 Scroll Down');
            },
            'go_back': () => {
                window.history.back();
                this.showFeedback('👈 Go Back');
            },
            'go_forward': () => {
                window.history.forward();
                this.showFeedback('👉 Go Forward');
            }
        };

        if (actions[gesture]) {
            actions[gesture]();
            console.log('Gesture executed:', gesture);
        }
    }

    showFeedback(message) {
        const existing = document.querySelector('.navigo-feedback');
        if (existing) existing.remove();

        const feedback = document.createElement('div');
        feedback.className = 'navigo-feedback';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #2196F3;
            color: white; padding: 15px 25px; border-radius: 8px;
            font-size: 18px; z-index: 999999;
        `;
        document.body.appendChild(feedback);

        setTimeout(() => feedback.remove(), 2000);
    }

    cleanupCamera() {
        const video = document.getElementById('gesture-camera');
        if (video?.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.remove();
        }
    }

    stop() {
        console.log('Stopping gestures...');
        this.isActive = false;
        
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        
        this.cleanupCamera();
        this.showFeedback('🛑 Gestures stopped');
    }
}

window.NavigoGestureController = GestureController;
