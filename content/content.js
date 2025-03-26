if (!window.navigoController) {
    class ContentController {
        constructor() {
            console.log('ContentController initialized');
            this.voiceActive = false;
            this.gestureActive = false;
            this.recognition = null;
            this.gestureInterval = null;
            this.hands = null;
            this.lastGestureTime = 0;
            this.gestureDelay = 1000; // Reduced delay
            this.gestureDebounce = {};
            this.setupMessageListener();
        }

        setupMessageListener() {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                console.log('Content script received message:', request);
                try {
                    switch (request.action) {
                        case 'openToolbar':
                            this.showToolbar();
                            break;
                        case 'startGestureNavigation':
                            this.toggleGestures(request.state);
                            break;
                        case 'startVoiceNavigation':
                            this.toggleVoice(request.state);
                            break;
                        case 'summarizePage':
                            this.summarizePage();
                            break;
                    }
                    sendResponse({ success: true });
                } catch (error) {
                    console.error('Error:', error);
                    sendResponse({ success: false, error: error.message });
                }
                return true;
            });
        }

        showToolbar() {
            console.log('Showing toolbar...');
            
            const existing = document.getElementById('navigo-toolbar');
            if (existing) existing.remove();

            const toolbar = document.createElement('div');
            toolbar.id = 'navigo-toolbar';
            toolbar.style.cssText = `
                position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                background: #000; border-radius: 12px; padding: 20px; z-index: 10000;
                display: flex; gap: 12px; color: #fff; font-family: Arial, sans-serif;
            `;
            
            toolbar.innerHTML = `
                <button id="voice-btn" style="padding: 10px 20px; border: none; border-radius: 6px; background: ${this.voiceActive ? '#28a745' : '#6a0dad'}; color: white; cursor: pointer;">
                    ${this.voiceActive ? 'Stop Voice' : 'Start Voice'}
                </button>
                <button id="gesture-btn" style="padding: 10px 20px; border: none; border-radius: 6px; background: ${this.gestureActive ? '#28a745' : '#6a0dad'}; color: white; cursor: pointer;">
                    ${this.gestureActive ? 'Stop Gestures' : 'Start Gestures'}
                </button>
                <button id="close-btn" style="padding: 10px 20px; border: none; border-radius: 6px; background: #dc3545; color: white; cursor: pointer;">Close</button>
            `;

            document.body.appendChild(toolbar);
            console.log('Toolbar added to page');

            document.getElementById('voice-btn').onclick = () => {
                this.toggleVoice();
            };

            document.getElementById('gesture-btn').onclick = () => {
                this.toggleGestures();
            };

            document.getElementById('close-btn').onclick = () => {
                this.cleanup();
                toolbar.remove();
                console.log('Toolbar closed');
            };

            this.showFeedback('Toolbar opened');
        }

        toggleVoice(state = null) {
            if (state !== null) {
                this.voiceActive = state;
            } else {
                this.voiceActive = !this.voiceActive;
            }
            
            console.log('Voice toggled:', this.voiceActive);
            
            if (this.voiceActive) {
                this.startVoice();
            } else {
                this.stopVoice();
            }
            
            this.updateToolbar();
        }

        startVoice() {
            try {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SpeechRecognition) {
                    throw new Error('Speech recognition not supported');
                }

                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = false;
                this.recognition.lang = 'en-US';

                this.recognition.onresult = (event) => {
                    const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
                    console.log('Voice command:', command);
                    this.processVoiceCommand(command);
                };

                this.recognition.onend = () => {
                    if (this.voiceActive) {
                        this.recognition.start();
                    }
                };

                this.recognition.onerror = (event) => {
                    console.error('Voice recognition error:', event.error);
                    this.showFeedback('Voice error: ' + event.error);
                };

                this.recognition.start();
                this.showFeedback('Voice navigation started');
            } catch (error) {
                console.error('Voice start error:', error);
                this.showFeedback('Voice not supported');
                this.voiceActive = false;
                this.updateToolbar();
            }
        }

        processVoiceCommand(command = '') {
            const commands = {
                'scroll up': () => {
                    window.scrollBy({ top: -300, behavior: 'smooth' });
                    this.showFeedback('Scrolling up');
                },
                'scroll down': () => {
                    window.scrollBy({ top: 300, behavior: 'smooth' });
                    this.showFeedback('Scrolling down');
                },
                'go back': () => {
                    window.history.back();
                    this.showFeedback('Going back');
                },
                'go forward': () => {
                    window.history.forward();
                    this.showFeedback('Going forward');
                },
                'reload': () => {
                    window.location.reload();
                    this.showFeedback('Reloading page');
                },
                'top': () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    this.showFeedback('Going to top');
                },
                'bottom': () => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    this.showFeedback('Going to bottom');
                }
            };

            for (const [key, action] of Object.entries(commands)) {
                if (command.includes(key)) {
                    action();
                    return;
                }
            }
            
            console.log('Unknown voice command:', command);
        }

        stopVoice() {
            if (this.recognition) {
                this.recognition.stop();
                this.recognition = null;
            }
            this.showFeedback('Voice navigation stopped');
        }

        toggleGestures(state = null) {
            if (state !== null) {
                this.gestureActive = state;
            } else {
                this.gestureActive = !this.gestureActive;
            }
            
            console.log('Gestures toggled:', this.gestureActive);
            
            if (this.gestureActive) {
                this.startGestures();
            } else {
                this.stopGestures();
            }
            
            this.updateToolbar();
        }

        async startGestures() {
            try {
                console.log('Starting gesture recognition...');
                
                // First get camera permission and setup video
                const video = await this.setupCamera();
                console.log('Camera setup successful');
                
                // Then load MediaPipe
                await this.loadMediaPipe();
                console.log('MediaPipe loaded successfully');
                
                // Finally start detection
                await this.startGestureDetection(video);
                console.log('Gesture detection started');
                
                this.showFeedback('Gesture navigation started');
            } catch (error) {
                console.error('Gesture start error:', error);
                this.showFeedback('Error: ' + error.message);
                this.gestureActive = false;
                this.updateToolbar();
            }
        }

        async setupCamera() {
            console.log('Setting up camera...');
            
            // Clean up any existing camera
            const existingVideo = document.getElementById('gesture-camera');
            if (existingVideo) {
                if (existingVideo.srcObject) {
                    existingVideo.srcObject.getTracks().forEach(track => track.stop());
                }
                existingVideo.remove();
            }

            // Remove any existing instruction panel
            const existingPanel = document.getElementById('gesture-instructions');
            if (existingPanel) {
                existingPanel.remove();
            }

            const video = document.createElement('video');
            video.id = 'gesture-camera';
            video.style.cssText = `
                position: fixed; bottom: 180px; right: 20px; width: 200px; height: 150px;
                border: 3px solid #4CAF50; border-radius: 8px; transform: scaleX(-1);
                z-index: 999998; background: #000;
            `;
            video.autoplay = true;
            video.playsInline = true;
            video.muted = true;
            
            // Add instruction panel
            const instructionPanel = document.createElement('div');
            instructionPanel.id = 'gesture-instructions';
            instructionPanel.style.cssText = `
                position: fixed; bottom: 340px; right: 20px; width: 194px;
                background: rgba(0, 0, 0, 0.9); color: white; padding: 12px;
                border-radius: 8px; font-family: Arial, sans-serif; font-size: 11px;
                z-index: 999999; text-align: center;
            `;
            instructionPanel.innerHTML = `
                <div style="font-weight: bold; color: #4CAF50; margin-bottom: 8px;">Simple Motion Gestures</div>
                <div>Move your hand or head:</div>
                <div>• Up = Scroll Up</div>
                <div>• Down = Scroll Down</div>
                <div>• Left = Go Back</div>
                <div>• Right = Go Forward</div>
                <div style="margin-top: 8px; font-size: 10px; opacity: 0.8;">Make clear movements</div>
            `;
            
            try {
                console.log('Requesting camera access...');
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
                document.body.appendChild(instructionPanel);
                
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Video loading timeout'));
                    }, 5000);
                    
                    video.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        console.log('Video metadata loaded');
                        video.play()
                            .then(() => {
                                console.log('Video playing');
                                resolve(video);
                            })
                            .catch(reject);
                    };
                    
                    video.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('Video load failed'));
                    };
                });
                
            } catch (error) {
                console.error('Camera access failed:', error);
                throw new Error('Camera access denied. Please allow camera access.');
            }
        }

        async loadMediaPipe() {
            console.log('Skipping MediaPipe - using simple gesture detection instead');
            // Instead of loading MediaPipe, we'll use simple motion detection
            return Promise.resolve();
        }

        async startGestureDetection(video) {
            console.log('Starting simple gesture detection...');
            
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 160;
                canvas.height = 120;
                const ctx = canvas.getContext('2d');
                
                let previousFrame = null;
                
                this.gestureInterval = setInterval(() => {
                    if (this.gestureActive && video && video.videoWidth > 0 && video.readyState >= 2) {
                        try {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            
                            if (previousFrame) {
                                const motion = this.detectMovement(previousFrame, currentFrame);
                                
                                if (motion.detected) {
                                    console.log('Motion detected:', motion);
                                    this.executeGesture(motion.direction);
                                }
                            }
                            
                            previousFrame = currentFrame;
                        } catch (err) {
                            console.warn('Detection error:', err);
                        }
                    }
                }, 100); // Faster detection
                
                console.log('Simple gesture detection initialized');
            } catch (error) {
                console.error('Error initializing gesture detection:', error);
                throw error;
            }
        }

        detectMovement(prevFrame, currFrame) {
            const prevData = prevFrame.data;
            const currData = currFrame.data;
            const width = currFrame.width;
            const height = currFrame.height;
            
            let totalChange = 0;
            let leftChange = 0;
            let rightChange = 0;
            let topChange = 0;
            let bottomChange = 0;
            
            // Divide frame into regions
            const midX = width / 2;
            const midY = height / 2;
            
            for (let i = 0; i < prevData.length; i += 12) { // More pixels sampled
                const r1 = prevData[i];
                const g1 = prevData[i + 1];
                const b1 = prevData[i + 2];
                
                const r2 = currData[i];
                const g2 = currData[i + 1];
                const b2 = currData[i + 2];
                
                const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
                
                if (diff > 20) { // Lower threshold
                    const pixelIndex = i / 4;
                    const x = pixelIndex % width;
                    const y = Math.floor(pixelIndex / width);
                    
                    totalChange += diff;
                    
                    if (x < midX) leftChange += diff;
                    else rightChange += diff;
                    
                    if (y < midY) topChange += diff;
                    else bottomChange += diff;
                }
            }
            
            if (totalChange > 2000) { // Much lower threshold
                const horizontalDiff = Math.abs(leftChange - rightChange);
                const verticalDiff = Math.abs(topChange - bottomChange);
                
                if (horizontalDiff > verticalDiff) {
                    return {
                        detected: true,
                        direction: leftChange > rightChange ? 'go_back' : 'go_forward'
                    };
                } else {
                    return {
                        detected: true,
                        direction: topChange > bottomChange ? 'scroll_up' : 'scroll_down'
                    };
                }
            }
            
            return { detected: false };
        }

        executeGesture(gesture) {
            if (!gesture) return;
            
            const now = Date.now();
            
            // Simple debounce - only allow one gesture every 2 seconds
            if (this.gestureDebounce[gesture] && (now - this.gestureDebounce[gesture]) < 2000) {
                return;
            }

            const actions = {
                'scroll_up': () => {
                    window.scrollBy({ top: -300, behavior: 'smooth' });
                    this.showFeedback('Scroll Up');
                },
                'scroll_down': () => {
                    window.scrollBy({ top: 300, behavior: 'smooth' });
                    this.showFeedback('Scroll Down');
                },
                'go_back': () => {
                    window.history.back();
                    this.showFeedback('Go Back');
                },
                'go_forward': () => {
                    window.history.forward();
                    this.showFeedback('Go Forward');
                }
            };

            if (actions[gesture]) {
                try {
                    actions[gesture]();
                    this.gestureDebounce[gesture] = now;
                    console.log('Gesture executed:', gesture);
                } catch (error) {
                    console.error('Gesture execution error:', error);
                }
            }
        }

        stopGestures() {
            console.log('Stopping gesture recognition...');
            
            if (this.gestureInterval) {
                clearInterval(this.gestureInterval);
                this.gestureInterval = null;
            }
            
            const video = document.getElementById('gesture-camera');
            if (video) {
                if (video.srcObject) {
                    video.srcObject.getTracks().forEach(track => {
                        track.stop();
                        console.log('Camera track stopped');
                    });
                }
                video.remove();
            }
            
            // Remove instruction panel
            const instructionPanel = document.getElementById('gesture-instructions');
            if (instructionPanel) {
                instructionPanel.remove();
            }
            
            this.hands = null;
            this.gestureDebounce = {};
            this.showFeedback('Gestures stopped');
        }

        updateToolbar() {
            const toolbar = document.getElementById('navigo-toolbar');
            if (toolbar) {
                toolbar.innerHTML = `
                    <button id="voice-btn" style="padding: 10px 20px; border: none; border-radius: 6px; background: ${this.voiceActive ? '#28a745' : '#6a0dad'}; color: white; cursor: pointer;">
                        ${this.voiceActive ? 'Stop Voice' : 'Start Voice'}
                    </button>
                    <button id="gesture-btn" style="padding: 10px 20px; border: none; border-radius: 6px; background: ${this.gestureActive ? '#28a745' : '#6a0dad'}; color: white; cursor: pointer;">
                        ${this.gestureActive ? 'Stop Gestures' : 'Start Gestures'}
                    </button>
                    <button id="close-btn" style="padding: 10px 20px; border: none; border-radius: 6px; background: #dc3545; color: white; cursor: pointer;">Close</button>
                `;

                document.getElementById('voice-btn').onclick = () => this.toggleVoice();
                document.getElementById('gesture-btn').onclick = () => this.toggleGestures();
                document.getElementById('close-btn').onclick = () => {
                    this.cleanup();
                    toolbar.remove();
                };
            }
        }

        summarizePage() {
            const text = document.body.innerText.slice(0, 500);
            this.showFeedback(`Page Summary: ${text.slice(0, 100)}...`);
        }

        cleanup() {
            this.stopVoice();
            this.stopGestures();
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

            setTimeout(() => feedback.remove(), 3000);
        }
    }

    window.navigoController = new ContentController();
    console.log('Navigo Controller initialized and ready');
}