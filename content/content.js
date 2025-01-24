if (!window.navigoController) {
    class ContentController {
        constructor() {
            console.log('ContentController initialized');
            this.toolbarVisible = false;
            this.setupMessageListener();
            this.injectStyles();
            this.loadSpeechController();
            
            this.testVisualFeedback();
        }

        testVisualFeedback() {
            console.log('Testing visual feedback...');
            const feedback = document.createElement('div');
            feedback.id = 'test-feedback';
            feedback.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: red;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                font-size: 18px;
                z-index: 999999;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            `;
            feedback.textContent = 'Testing Visual Feedback';
            document.body.appendChild(feedback);

            setTimeout(() => {
                feedback.remove();
            }, 3000);
        }

        setupMessageListener() {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                console.log('Content script received message:', request);
                
                try {
                    if (request.action === 'openToolbar') {
                        console.log('Opening toolbar...');
                        this.injectToolbar();
                        sendResponse({ success: true });
                    }
                } catch (error) {
                    console.error('Error handling message:', error);
                    sendResponse({ success: false, error: error.message });
                }
                return true;
            });
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = style.textContent = `
            .navigo-toolbar {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #000; /* Black */
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                border-radius: 12px;
                padding: 20px;
                z-index: 10000;
                display: flex;
                gap: 12px;
                min-width: 320px;
                color: #fff;
                font-family: 'Inter', sans-serif;
            }

            .navigo-toolbar button {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                background: #6a0dad; /* Purple */
                color: white;
                cursor: pointer;
                transition: background 0.3s, transform 0.2s;
                font-size: 14px;
            }

            .navigo-toolbar button:hover {
                background: #5a0cae; /* Slightly darker purple */
                transform: translateY(-2px);
            }

            .navigo-toolbar button.active {
                background: #28a745; /* Green */
            }

            #summaryContainer {
                margin-top: 20px;
                padding: 15px;
                background: #1E1E1E; /* Dark Gray */
                border-radius: 8px;
                color: #fff;
            }

            .voice-feedback {
                position: fixed;
                bottom: 80px;
                right: 20px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                z-index: 10001;
            }
        `;
            document.head.appendChild(style);
        }

        injectToolbar() {
            if (document.getElementById('navigo-toolbar')) {
                console.log('Toolbar already exists');
                return;
            }

            console.log('Injecting toolbar');
            const toolbar = document.createElement('div');
            toolbar.id = 'navigo-toolbar';
            toolbar.className = 'navigo-toolbar';
            
            toolbar.innerHTML = `
                <div class="toolbar-controls">
                    <button id="listMics" data-feature="List Microphones">List Microphones</button>
                    <button id="voiceNav" data-feature="Voice Navigation">Start Voice Navigation</button>
                    <button id="gestureNav" data-feature="Gesture Navigation">Start Gesture Navigation</button>
                    <button id="closeToolbar">Close</button>
                </div>
                <div id="microphoneList" style="display: none; margin-top: 10px;">
                    <h3>Available Microphones:</h3>
                    <ul id="micList" style="list-style: none; padding: 0;"></ul>
                </div>
                <div id="micLevel" style="display: none; margin-top: 10px;">
                    <label>Microphone Level:</label>
                    <div class="mic-meter">
                        <div class="mic-level-bar"></div>
                    </div>
                </div>
            `;

            const style = document.createElement('style');
            style.textContent = `
            .navigo-toolbar {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #0A192F; /* Dark Blue */
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                border-radius: 12px;
                padding: 20px;
                z-index: 10000;
                min-width: 320px;
                color: #fff;
                font-family: 'Inter', sans-serif;
            }
            .toolbar-controls {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                justify-content: center;
            }
            .toolbar-controls button {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                background: #1E90FF; /* Dodger Blue */
                color: white;
                cursor: pointer;
                transition: background 0.3s, transform 0.2s;
                font-size: 14px;
            }
            .toolbar-controls button:hover {
                background: #1C86EE; /* Slightly darker blue */
                transform: translateY(-2px);
            }
            .toolbar-controls button:disabled {
                background: #A9A9A9; /* Dark Gray */
                cursor: not-allowed;
            }
            #microphoneList {
                margin-top: 20px;
                background: #1E1E1E; /* Dark Gray */
                padding: 15px;
                border-radius: 8px;
                color: #fff;
            }
            #micList li {
                padding: 10px 15px;
                margin: 8px 0;
                background: #2E2E2E; /* Slightly lighter gray */
                border-radius: 5px;
                cursor: pointer;
                transition: background 0.2s;
            }
            #micList li:hover {
                background: #3E3E3E; /* Even lighter gray */
            }
        `;
            document.head.appendChild(style);

            document.body.appendChild(toolbar);
            this.addToolbarListeners();
            this.toolbarVisible = true;
            console.log('Toolbar injected successfully');
        }

        addToolbarListeners() {
            const elements = {
                listMics: document.getElementById('listMics'),
                voiceNav: document.getElementById('voiceNav'),
                gestureNav: document.getElementById('gestureNav'),
                closeToolbar: document.getElementById('closeToolbar'),
                microphoneList: document.getElementById('microphoneList'),
                micList: document.getElementById('micList'),
                micLevel: document.getElementById('micLevel')
            };

            let state = {
                isVoiceActive: false,
                isGestureActive: false
            };

            elements.voiceNav.addEventListener('click', () => {
                state.isVoiceActive = !state.isVoiceActive;
                this.toggleVoiceNavigation(state.isVoiceActive);
                this.updateButtonState(elements.voiceNav, state.isVoiceActive);
            });

            elements.gestureNav.addEventListener('click', () => {
                state.isGestureActive = !state.isGestureActive;
                this.toggleGestureNavigation(state.isGestureActive);
                this.updateButtonState(elements.gestureNav, state.isGestureActive);
            });

            //elements.summarizeBtn.addEventListener('click', () => this.handleSummarizeClick());

            elements.closeToolbar.addEventListener('click', () => {
                if (state.isVoiceActive) this.toggleVoiceNavigation(false);
                if (state.isGestureActive) this.toggleGestureNavigation(false);
                document.getElementById('navigo-toolbar').remove();
                this.toolbarVisible = false;
            });

            elements.listMics?.addEventListener('click', async () => {
                console.log('List Microphones clicked');
                elements.listMics.disabled = true;
                elements.listMics.textContent = 'Requesting Permission...';
                
                const permissionGranted = await this.requestMicrophonePermission();
                
                if (!permissionGranted) {
                    elements.listMics.textContent = 'Permission Denied';
                    setTimeout(() => {
                        elements.listMics.disabled = false;
                        elements.listMics.textContent = 'List Microphones';
                    }, 2000);
                } else {
                    elements.listMics.disabled = false;
                    elements.listMics.textContent = 'List Microphones';
                }
            });
        }

        updateButtonState(button, isActive) {
            console.log('Updating button state:', isActive);
            button.classList.toggle('active', isActive);
            button.textContent = `${isActive ? 'Stop' : 'Start'} ${button.dataset.feature}`;
            
            if (isActive) {
                button.style.backgroundColor = '#28a745';
            } else {
                button.style.backgroundColor = '#007bff';
            }
        }

        async checkMicrophoneStatus() {
            try {
                // List available audio devices
                const devices = await navigator.mediaDevices.enumerateDevices();
                const microphones = devices.filter(device => device.kind === 'audioinput');
                
                console.log('Available microphones:', microphones);
                
                if (microphones.length === 0) {
                    this.showFeedback('No microphones found! Please connect a microphone.');
                    return false;
                }

                // Test microphone access
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });

                console.log('Microphone access granted:', stream);
                
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                const microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
                
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                
                const activeMic = microphones.find(m => m.deviceId === stream.getAudioTracks()[0].getSettings().deviceId);
                this.showFeedback(`Using microphone: ${activeMic ? activeMic.label : 'Default device'}`);
                
                return new Promise((resolve) => {
                    const checkSound = () => {
                        analyser.getByteFrequencyData(dataArray);
                        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
                        console.log('Current microphone level:', average);
                        
                        if (average > 0) {
                            console.log('Sound detected!');
                            stream.getTracks().forEach(track => track.stop());
                            audioContext.close();
                            resolve(true);
                        } else {
                            this.showFeedback('Speak to test microphone...');
                            setTimeout(checkSound, 100);
                        }
                    };
                    
                    checkSound();
                });
            } catch (error) {
                console.error('Microphone check failed:', error);
                this.showFeedback(`Microphone Error: ${error.message}`);
                return false;
            }
        }

        async listAvailableMicrophones() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const microphones = devices.filter(device => device.kind === 'audioinput');
                
                console.log('Available Microphones:');
                microphones.forEach((mic, index) => {
                    console.log(`${index + 1}. ${mic.label || 'Unnamed Microphone'} (${mic.deviceId})`);
                });

                // Show in UI
                let micList = 'Available Microphones:\n';
                microphones.forEach((mic, index) => {
                    micList += `${index + 1}. ${mic.label || 'Unnamed Microphone'}\n`;
                });
                this.showFeedback(micList);

                return microphones;
            } catch (error) {
                console.error('Error listing microphones:', error);
                this.showFeedback('Error listing microphones: ' + error.message);
                return [];
            }
        }

        async toggleVoiceNavigation(state) {
            console.log('Attempting to toggle voice navigation:', state);
            
            if (state) {
                try {
                    const micStatus = await this.checkMicrophoneStatus();
                    console.log('Microphone status:', micStatus);
                    
                    if (micStatus) {
                        if (!this.speechController) {
                            console.log('Initializing speech controller');
                            this.showFeedback('Initializing voice navigation...');
                            
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            this.speechController = new this.SpeechController();
                            
                            if (!this.speechController.recognition) {
                                throw new Error('Speech recognition failed to initialize');
                            }
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        console.log('Starting speech recognition');
                        await this.speechController.start();
                        
                        if (!this.speechController.isListening) {
                            throw new Error('Failed to start speech recognition');
                        }
                        
                        this.showFeedback('Voice navigation activated. Say "Hey Navigo" to start.');
                        
                        this.voiceStatusInterval = setInterval(() => {
                            if (!this.speechController.isListening) {
                                console.log('Restarting speech recognition...');
                                this.speechController.start();
                            }
                        }, 5000);
                        
                    } else {
                        throw new Error('Microphone not working or not accessible');
                    }
                } catch (error) {
                    console.error('Voice navigation error:', error);
                    this.showFeedback(`Error: ${error.message}`);
                    const voiceNav = document.getElementById('voiceNav');
                    if (voiceNav) {
                        this.updateButtonState(voiceNav, false);
                    }
                }
            } else if (this.speechController) {
                console.log('Stopping speech recognition');
                
                if (this.voiceStatusInterval) {
                    clearInterval(this.voiceStatusInterval);
                    this.voiceStatusInterval = null;
                }
                
                await this.speechController.stop();
                this.showFeedback('Voice navigation deactivated');
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                this.speechController = null;
            }
        }

        async toggleGestureNavigation(state) {
            console.log('🎥 Toggling gesture navigation:', state ? 'ON' : 'OFF');
            
            if (state) {
                try {
                    console.log('🎥 Initializing gesture navigation...');
                    
                    if (!document.querySelector('.input_video')) {
                        const videoElement = document.createElement('video');
                        videoElement.className = 'input_video';
                        videoElement.style.cssText = `
                            position: fixed;
                            right: 0;
                            bottom: 140px;
                            width: 192px;
                            height: 144px;
                            border-radius: 8px;
                            border: 2px solid #2196F3;
                            z-index: 999998;
                            transform: scaleX(-1); /* Mirror the video */
                            background: #000;
                        `;
                        videoElement.autoplay = true;
                        videoElement.playsInline = true;
                        document.body.appendChild(videoElement);
                        console.log('📹 Video element created');
                    }

                    if (!document.querySelector('.output_canvas')) {
                        const canvasElement = document.createElement('canvas');
                        canvasElement.className = 'output_canvas';
                        canvasElement.width = 640;
                        canvasElement.height = 480;
                        canvasElement.style.cssText = `
                            position: fixed;
                            right: 0;
                            bottom: 140px;
                            width: 192px;
                            height: 144px;
                            border-radius: 8px;
                            border: 2px solid #2196F3;
                            background: rgba(0,0,0,0.5);
                            z-index: 999999;
                        `;
                        document.body.appendChild(canvasElement);
                        console.log('🎨 Canvas element created');
                    }

                    try {
                        console.log('📸 Requesting camera access...');
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                width: { ideal: 640 },
                                height: { ideal: 480 },
                                facingMode: 'user'
                            }
                        });
                        console.log('✅ Camera access granted:', stream);

                        const videoElement = document.querySelector('.input_video');
                        videoElement.srcObject = stream;
                        
                        videoElement.onloadedmetadata = () => {
                            console.log('📹 Video metadata loaded');
                            videoElement.play()
                                .then(() => {
                                    console.log('▶️ Video playback started');
                                    this.startGestureDetection(videoElement);
                                })
                                .catch(err => console.error('❌ Video playback error:', err));
                        };

                        const indicator = document.createElement('div');
                        indicator.id = 'gesture-indicator';
                        indicator.textContent = '🎥 Camera Active';
                        indicator.style.cssText = `
                            position: fixed;
                            bottom: 290px;
                            right: 10px;
                            background: rgba(0, 0, 0, 0.8);
                            color: white;
                            padding: 5px 10px;
                            border-radius: 5px;
                            z-index: 999999;
                            font-family: Arial, sans-serif;
                            font-size: 12px;
                        `;
                        document.body.appendChild(indicator);

                        this.showFeedback('✅ Gesture navigation activated');
                        
                    } catch (error) {
                        console.error('❌ Error accessing camera:', error);
                        throw new Error('Could not access camera: ' + error.message);
                    }
                    
                } catch (error) {
                    console.error('❌ Error initializing gestures:', error);
                    this.showFeedback('❌ Error: ' + error.message);
                    
                    const gestureNav = document.getElementById('gestureNav');
                    if (gestureNav) {
                        this.updateButtonState(gestureNav, false);
                    }
                }
            } else {
                console.log('🛑 Stopping gesture navigation...');
                
                if (this.gestureDetectionInterval) {
                    clearInterval(this.gestureDetectionInterval);
                    this.gestureDetectionInterval = null;
                }
                
                const videoElement = document.querySelector('.input_video');
                const canvasElement = document.querySelector('.output_canvas');
                const indicator = document.getElementById('gesture-indicator');
                
                if (videoElement) {
                    const stream = videoElement.srcObject;
                    if (stream) {
                        stream.getTracks().forEach(track => {
                            track.stop();
                            console.log('Stopped track:', track.kind);
                        });
                    }
                    videoElement.remove();
                }
                
                if (canvasElement) canvasElement.remove();
                if (indicator) indicator.remove();
                
                this.showFeedback('🛑 Gesture navigation deactivated');
            }
        }

        startGestureDetection(videoElement) {
            const canvasElement = document.querySelector('.output_canvas');
            const canvasCtx = canvasElement.getContext('2d');
            let lastY = 0;
            let frameCount = 0;
            const FRAMES_TO_ANALYZE = 10;
            const MOVEMENT_THRESHOLD = 50;

            this.gestureDetectionInterval = setInterval(() => {
                try {
                    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
                    
                    const centerX = Math.floor(canvasElement.width / 2);
                    const centerY = Math.floor(canvasElement.height / 2);
                    const pixelData = canvasCtx.getImageData(centerX - 5, centerY - 5, 10, 10).data;
                    
                    let totalBrightness = 0;
                    for (let i = 0; i < pixelData.length; i += 4) {
                        const r = pixelData[i];
                        const g = pixelData[i + 1];
                        const b = pixelData[i + 2];
                        totalBrightness += (r + g + b) / 3;
                    }
                    const avgBrightness = totalBrightness / (pixelData.length / 4);
                    
                    if (frameCount === 0) {
                        lastY = avgBrightness;
                    }
                    
                    const movement = avgBrightness - lastY;
                    frameCount++;
                    
                    if (frameCount >= FRAMES_TO_ANALYZE) {
                        if (Math.abs(movement) > MOVEMENT_THRESHOLD) {
                            if (movement > 0) {
                                console.log('⬇️ Downward movement detected');
                                window.scrollBy({
                                    top: window.innerHeight / 2,
                                    behavior: 'smooth'
                                });
                                this.showFeedback('⬇️ Scrolling down');
                            } else {
                                console.log('⬆️ Upward movement detected');
                                window.scrollBy({
                                    top: -window.innerHeight / 2,
                                    behavior: 'smooth'
                                });
                                this.showFeedback('⬆️ Scrolling up');
                            }
                        }
                        frameCount = 0;
                    }
                    
                    lastY = avgBrightness;
                    
                } catch (error) {
                    console.error('Error in gesture detection:', error);
                }
            }, 100); // Check every 100ms
        }

        showFeedback(message) {
            console.log('Showing feedback:', message);
            const feedback = document.createElement('div');
            feedback.className = 'navigo-feedback';
            feedback.textContent = message;
            
            feedback.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2196F3;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                font-size: 18px;
                z-index: 999999;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideIn 0.3s ease forwards;
            `;

            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);

            const existingFeedback = document.querySelector('.navigo-feedback');
            if (existingFeedback) {
                existingFeedback.remove();
            }

            document.body.appendChild(feedback);

            setTimeout(() => {
                feedback.style.opacity = '0';
                feedback.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    feedback.remove();
                    style.remove();
                }, 300);
            }, 3000);
        }

        async selectMicrophone(mic) {
            console.log('Selected microphone:', mic);
            this.showFeedback(`Selected: ${mic.label}`);
            
            this.selectedMicrophone = mic;
            
            const micItems = document.querySelectorAll('#micList li');
            micItems.forEach(item => item.classList.remove('selected'));
            const selectedItem = Array.from(micItems).find(item => item.dataset.deviceId === mic.deviceId);
            if (selectedItem) {
                selectedItem.classList.add('selected');
            }
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: { exact: mic.deviceId }
                    }
                });
                this.showFeedback('Microphone test successful!');
                stream.getTracks().forEach(track => track.stop());
            } catch (error) {
                console.error('Error testing microphone:', error);
                this.showFeedback('Error testing microphone: ' + error.message);
            }
        }

        async requestMicrophonePermission() {
            try {
                console.log('Requesting microphone permission...');
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('Microphone permission granted');
                
                // Stop the stream right away as we just needed the permission
                stream.getTracks().forEach(track => track.stop());
                
                const devices = await navigator.mediaDevices.enumerateDevices();
                const microphones = devices.filter(device => device.kind === 'audioinput');
                
                console.log('Found microphones:', microphones);
                
                if (microphones.length === 0) {
                    this.showFeedback('No microphones found! Please connect a microphone.');
                    return false;
                }

                const micList = document.getElementById('micList');
                if (micList) {
                    micList.innerHTML = '';
                    microphones.forEach((mic, index) => {
                        const li = document.createElement('li');
                        li.textContent = mic.label || `Microphone ${index + 1}`;
                        li.dataset.deviceId = mic.deviceId;
                        li.addEventListener('click', () => this.selectMicrophone(mic));
                        micList.appendChild(li);
                    });
                    document.getElementById('microphoneList').style.display = 'block';
                }

                this.showFeedback(`Found ${microphones.length} microphone(s). Please select one.`);
                return true;
            } catch (error) {
                console.error('Error requesting microphone permission:', error);
                this.showFeedback('Error: Could not access microphone. Please check permissions.');
                return false;
            }
        }

        loadSpeechController() {
            // Make SpeechController available on the instance
            this.SpeechController = class {
                constructor() {
                    console.log('SpeechController: Initializing...');
                    
                    this.createFeedbackElement();
                    
                    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                        console.error('SpeechController: Speech recognition not supported');
                        throw new Error('Speech recognition not supported in this browser');
                    }

                    try {
                        this.recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
                        this.isListening = false;
                        this.commandMode = false;
                        this.lastResult = '';
                        
                        this.commands = {
                            'scroll down': () => {
                                console.log('Executing: scroll down');
                                window.scrollBy({
                                    top: window.innerHeight / 2,
                                    behavior: 'smooth'
                                });
                                this.showVisualFeedback('⬇️ Scrolling down');
                            },
                            'scroll up': () => {
                                console.log('Executing: scroll up');
                                window.scrollBy({
                                    top: -(window.innerHeight / 2),
                                    behavior: 'smooth'
                                });
                                this.showVisualFeedback('⬆️ Scrolling up');
                            },
                            'page down': () => {
                                console.log('Executing: page down');
                                window.scrollBy({
                                    top: window.innerHeight,
                                    behavior: 'smooth'
                                });
                                this.showVisualFeedback('⬇️ Moving down one page');
                            },
                            'page up': () => {
                                console.log('Executing: page up');
                                window.scrollBy({
                                    top: -window.innerHeight,
                                    behavior: 'smooth'
                                });
                                this.showVisualFeedback('⬆️ Moving up one page');
                            },
                            'bottom': () => {
                                console.log('Executing: bottom');
                                window.scrollTo({
                                    top: document.documentElement.scrollHeight,
                                    behavior: 'smooth'
                                });
                                this.showVisualFeedback('⬇️ Scrolling to bottom');
                            },
                            'top': () => {
                                console.log('Executing: top');
                                window.scrollTo({
                                    top: 0,
                                    behavior: 'smooth'
                                });
                                this.showVisualFeedback('⬆️ Scrolling to top');
                            },
                            'next': () => {
                                console.log('Executing: next');
                                if (window.navigationEngine) {
                                    window.navigationEngine.focusNext();
                                    this.showVisualFeedback('⏭️ Next element');
                                }
                            },
                            'previous': () => {
                                console.log('Executing: previous');
                                if (window.navigationEngine) {
                                    window.navigationEngine.focusPrevious();
                                    this.showVisualFeedback('⏮️ Previous element');
                                }
                            },
                            'click': () => {
                                console.log('Executing: click');
                                const focusedElement = document.querySelector(':focus');
                                if (focusedElement) {
                                    focusedElement.click();
                                    this.showVisualFeedback('🖱️ Clicking element');
                                } else {
                                    this.showVisualFeedback('No element focused');
                                }
                            }
                        };

                        this.setupRecognition();
                        console.log('SpeechController initialized successfully');
                    } catch (error) {
                        console.error('Error initializing speech recognition:', error);
                        throw error;
                    }
                }

                createFeedbackElement() {
                    const style = document.createElement('style');
                    style.textContent = `
                        .voice-feedback-container {
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #2196F3;
                            color: white;
                            padding: 15px 25px;
                            border-radius: 8px;
                            font-size: 18px;
                            z-index: 999999;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                            display: none;
                            font-family: Arial, sans-serif;
                            max-width: 300px;
                            text-align: center;
                        }

                        .voice-feedback-container.active {
                            display: block;
                            animation: slideIn 0.3s ease forwards;
                        }

                        .voice-feedback-container.command-mode {
                            background: #4CAF50;
                        }

                        .voice-feedback-container.error {
                            background: #f44336;
                        }

                        @keyframes slideIn {
                            from {
                                transform: translateX(100%);
                                opacity: 0;
                            }
                            to {
                                transform: translateX(0);
                                opacity: 1;
                            }
                        }

                        .voice-status-indicator {
                            position: fixed;
                            bottom: 20px;
                            right: 20px;
                            width: 50px;
                            height: 50px;
                            border-radius: 25px;
                            background: #2196F3;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 999999;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        }

                        .voice-status-indicator::after {
                            content: '🎤';
                            font-size: 24px;
                        }

                        .voice-status-indicator.listening {
                            animation: pulse 2s infinite;
                        }

                        @keyframes pulse {
                            0% {
                                transform: scale(1);
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                            }
                            50% {
                                transform: scale(1.1);
                                box-shadow: 0 4px 20px rgba(33, 150, 243, 0.4);
                            }
                            100% {
                                transform: scale(1);
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                            }
                        }
                    `;
                    document.head.appendChild(style);

                    const feedback = document.createElement('div');
                    feedback.id = 'voice-feedback';
                    feedback.className = 'voice-feedback-container';
                    document.body.appendChild(feedback);

                    const statusIndicator = document.createElement('div');
                    statusIndicator.id = 'voice-status';
                    statusIndicator.className = 'voice-status-indicator';
                    document.body.appendChild(statusIndicator);
                }

                showVisualFeedback(message, type = 'info') {
                    console.log(`💬 Feedback: ${message}`);
                    const feedback = document.getElementById('voice-feedback');
                    if (feedback) {
                        feedback.textContent = message;
                        feedback.className = `voice-feedback-container active ${type}`;
                        feedback.style.display = 'block';

                        setTimeout(() => {
                            feedback.style.opacity = '0';
                            setTimeout(() => {
                                feedback.style.display = 'none';
                                feedback.style.opacity = '1';
                            }, 300);
                        }, 2000);
                    }
                }

                setupRecognition() {
                    this.recognition.continuous = true;
                    this.recognition.interimResults = true;
                    this.recognition.lang = 'en-US';
                    this.recognition.maxAlternatives = 5; // Increased for better matching

                    this.recognition.onstart = () => {
                        console.log('🎤 Recognition started');
                        this.isListening = true;
                        this.showVisualFeedback('🎤 Listening... Say "Hey Navigo"');
                    };

                    this.recognition.onresult = (event) => {
                        const last = event.results.length - 1;
                        
                        for (let i = 0; i < event.results[last].length; i++) {
                            const transcript = event.results[last][i].transcript.trim().toLowerCase();
                            const confidence = event.results[last][i].confidence;
                            
                            console.log(`🎤 Heard (${confidence.toFixed(2)}): "${transcript}"`);
                            
                            if (this.isWakeWord(transcript)) {
                                console.log('🎯 Wake word detected in alternative', i);
                                this.handleWakeWord();
                                return;
                            }
                        }

                        if (this.commandMode) {
                            const transcript = event.results[last][0].transcript.trim().toLowerCase();
                            console.log('⚡ Processing command:', transcript);
                            this.processCommand(transcript);
                        } else {
                            console.log('❌ Not in command mode. Say "Hey Navigo" first!');
                            this.showVisualFeedback('Say "Hey Navigo" to start');
                        }
                    };

                    this.recognition.onerror = (event) => {
                        console.error('❌ Recognition error:', event.error);
                        this.showVisualFeedback(`Error: ${event.error}`);
                    };

                    this.recognition.onend = () => {
                        console.log('🛑 Recognition ended');
                        if (this.isListening) {
                            console.log('🔄 Restarting recognition');
                            try {
                                this.recognition.start();
                            } catch (error) {
                                console.error('❌ Error restarting recognition:', error);
                            }
                        }
                    };
                }

                handleWakeWord() {
                    console.log('🎯 Wake word detected - activating command mode');
                    this.commandMode = true;
                    this.showVisualFeedback('🎯 Hey Navigo activated! Ready for commands...', 'command');
                    
                    if (this.commandModeTimeout) {
                        clearTimeout(this.commandModeTimeout);
                    }
                    
                    this.commandModeTimeout = setTimeout(() => {
                        if (this.commandMode) {
                            this.commandMode = false;
                            console.log('⏰ Command mode timed out');
                            this.showVisualFeedback('⏰ Command mode timed out. Say "Hey Navigo" to start again.');
                        }
                    }, 15000);
                }

                processCommand(transcript) {
                    console.log('⚡ Processing command:', transcript);
                    let commandExecuted = false;

                    const commands = {
                        'scroll down': () => {
                            console.log('📜 Executing: scroll down');
                            window.scrollBy({
                                top: window.innerHeight / 2,
                                behavior: 'smooth'
                            });
                            this.showVisualFeedback('⬇️ Scrolling down');
                            commandExecuted = true;
                        },
                        'scroll up': () => {
                            console.log('📜 Executing: scroll up');
                            window.scrollBy({
                                top: -(window.innerHeight / 2),
                                behavior: 'smooth'
                            });
                            this.showVisualFeedback('⬆️ Scrolling up');
                            commandExecuted = true;
                        },
                        'page down': () => {
                            console.log('📜 Executing: page down');
                            window.scrollBy({
                                top: window.innerHeight,
                                behavior: 'smooth'
                            });
                            this.showVisualFeedback('⬇️ Moving down one page');
                            commandExecuted = true;
                        },
                        'page up': () => {
                            console.log('📜 Executing: page up');
                            window.scrollBy({
                                top: -window.innerHeight,
                                behavior: 'smooth'
                            });
                            this.showVisualFeedback('⬆️ Moving up one page');
                            commandExecuted = true;
                        },
                        'top': () => {
                            console.log('📜 Executing: go to top');
                            window.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                            });
                            this.showVisualFeedback('⬆️ Going to top');
                            commandExecuted = true;
                        },
                        'bottom': () => {
                            console.log('📜 Executing: go to bottom');
                            window.scrollTo({
                                top: document.documentElement.scrollHeight,
                                behavior: 'smooth'
                            });
                            this.showVisualFeedback('⬇️ Going to bottom');
                            commandExecuted = true;
                        }
                    };

                    const cleanTranscript = transcript.toLowerCase().trim();
                    console.log('🎯 Clean transcript:', cleanTranscript);

                    for (const [command, action] of Object.entries(commands)) {
                        if (cleanTranscript.includes(command)) {
                            console.log(`🎯 Found command: ${command}`);
                            try {
                                action();
                                console.log(`✅ Executed: ${command}`);
                            } catch (error) {
                                console.error(`❌ Error executing ${command}:`, error);
                                this.showVisualFeedback(`Error executing: ${command}`);
                            }
                            break;
                        }
                    }

                    if (!commandExecuted) {
                        console.log('❌ Command not recognized:', cleanTranscript);
                        this.showVisualFeedback(`Command not recognized: "${cleanTranscript}"`);
                    }
                }

                start() {
                    console.log('Starting speech recognition');
                    try {
                        this.recognition.start();
                        this.showVisualFeedback('🎤 Voice navigation started');
                    } catch (error) {
                        console.error('Error starting recognition:', error);
                        throw error;
                    }
                }

                stop() {
                    console.log('Stopping speech recognition');
                    this.isListening = false;
                    this.commandMode = false;
                    try {
                        this.recognition.stop();
                        this.showVisualFeedback('🛑 Voice navigation stopped');
                    } catch (error) {
                        console.error('Error stopping recognition:', error);
                    }
                }

                isWakeWord(transcript) {
                    console.log('🔍 Checking wake word in:', transcript);
                    
                    const wakeWords = [
                        'hey navigo',
                        'hey navigate',
                        'hey navigator',
                        'hey now we go',
                        'hey now ago',
                        'hey now to go',
                        'hey now vehicle',
                        'hey now we call',
                        'hey novigo',
                        'hey navigate oh',
                        'hay navigo',
                        'hey navy go',
                        'hey now we',
                        'hey now the go',
                        'hey now let\'s go',
                        'a navigo',
                        'hey now ago',
                        'hey now vehicle',
                        'hey now',
                        'hey nav',
                        'hey navi',
                        'hey navigon',
                        'hey navigor',
                        'hey navig',
                        'hey nev',
                        'hey nav e',
                        'hey nav i',
                        'hey now v',
                        'hey now we',
                        'hey now n',
                        'hey now nav'
                    ];

                    for (const wake of wakeWords) {
                        if (transcript.includes(wake)) {
                            console.log('🎯 Wake word matched:', wake);
                            return true;
                        }
                    }

                    const words = transcript.split(' ');
                    const lastTwoWords = words.slice(-2).join(' ');
                    const lastThreeWords = words.slice(-3).join(' ');

                    if (lastTwoWords.includes('nav') || 
                        lastTwoWords.includes('now') || 
                        lastTwoWords.includes('hey') ||
                        lastThreeWords.includes('hey') ||
                        lastThreeWords.includes('nav') ||
                        lastThreeWords.includes('now we')) {
                        console.log('🎯 Partial wake word match:', lastThreeWords);
                        return true;
                    }

                    return false;
                }
            };
        }

        async handleSummarizeClick() {
            try {
                this.createLoadingIndicator();
                console.log('Starting page summarization...');
                this.updateLoadingStatus('Analyzing page content...');

                const { summarizer } = await import(chrome.runtime.getURL('modules/aisummarizer.js'));

                this.updateLoadingStatus('Extracting page content...');
                let text;
                if (window.location.hostname.includes('wikipedia.org')) {
                    const content = document.querySelector('#mw-content-text');
                    if (content) {
                        this.updateLoadingStatus('Processing Wikipedia content...');
                        const clone = content.cloneNode(true);
                        const removeSelectors = [
                            '.reference',
                            '.mw-editsection',
                            '.mw-references-wrap',
                            '.navigation-not-searchable',
                            'table',
                            '.thumb',
                            '.infobox',
                            '.sidebar'
                        ];
                        removeSelectors.forEach(selector => {
                            clone.querySelectorAll(selector).forEach(el => el.remove());
                        });
                        text = clone.textContent;
                    }
                } else {
                    this.updateLoadingStatus('Extracting main content...');
                    const mainContent = document.querySelector('main, article, .content, #content');
                    text = mainContent ? mainContent.textContent : document.body.textContent;
                }

                if (!text) {
                    throw new Error('No content found to summarize');
                }

                this.updateLoadingStatus('Cleaning text...');
                text = text
                    .replace(/\s+/g, ' ')
                    .replace(/\[[0-9]*\]/g, '')
                    .trim();

                const maxLength = 8000;
                if (text.length > maxLength) {
                    text = text.substring(0, maxLength) + '...';
                }

                this.updateLoadingStatus('Generating AI summary...');
                const summary = await summarizer.summarizeText(text);

                this.removeLoadingIndicator();
                this.displaySummary(summary);

            } catch (error) {
                console.error('Summarization failed:', error);
                this.removeLoadingIndicator();
                this.showFeedback(`Error: ${error.message}`);
            }
        }

        displaySummary(summary) {
            this.removeLoadingIndicator();

            const existingSummary = document.getElementById('page-summary-container');
            if (existingSummary) {
                existingSummary.remove();
            }

            const container = document.createElement('div');
            container.id = 'page-summary-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 350px;
                max-height: 80vh;
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                overflow-y: auto;
                font-family: Arial, sans-serif;
                animation: slidein 0.3s ease-out;
            `;

            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            `;

            const title = document.createElement('h3');
            title.textContent = 'Page Summary';
            title.style.margin = '0';

            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.style.cssText = `
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 0 5px;
                color: #666;
            `;
            
            closeButton.onclick = () => {
                container.remove();
                this.removeLoadingIndicator(); // Ensure loading indicator is removed
                const style = document.getElementById('summary-styles');
                if (style) style.remove();
            };

            header.appendChild(title);
            header.appendChild(closeButton);
            container.appendChild(header);

            const content = document.createElement('div');
            content.style.cssText = `
                line-height: 1.5;
                color: #333;
            `;
            content.innerHTML = summary.split('\n').map(point => `<p>${point}</p>`).join('');
            container.appendChild(content);

            const style = document.createElement('style');
            style.id = 'summary-styles';
            style.textContent = `
                @keyframes slidein {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(container);
        }

        createLoadingIndicator() {
            const existing = document.getElementById('ai-summary-loading');
            if (existing) existing.remove();

            const loader = document.createElement('div');
            loader.id = 'ai-summary-loading';
            loader.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: Arial, sans-serif;
                min-width: 250px;
            `;

            const spinnerContainer = document.createElement('div');
            spinnerContainer.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 15px;
            `;

            const spinner = document.createElement('div');
            spinner.style.cssText = `
                width: 24px;
                height: 24px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                margin-right: 10px;
                animation: spin 1s linear infinite;
            `;

            const statusText = document.createElement('div');
            statusText.id = 'ai-summary-status';
            statusText.style.cssText = `
                color: #666;
                font-size: 14px;
            `;

            const progressBar = document.createElement('div');
            progressBar.style.cssText = `
                width: 100%;
                height: 4px;
                background: #f3f3f3;
                border-radius: 2px;
                overflow: hidden;
            `;

            const progress = document.createElement('div');
            progress.style.cssText = `
                width: 0%;
                height: 100%;
                background: #3498db;
                transition: width 0.3s ease;
                animation: progress 2s infinite;
            `;

            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 100%; }
                    100% { width: 0%; }
                }
            `;

            progressBar.appendChild(progress);
            spinnerContainer.appendChild(spinner);
            spinnerContainer.appendChild(statusText);
            loader.appendChild(spinnerContainer);
            loader.appendChild(progressBar);
            document.head.appendChild(style);
            document.body.appendChild(loader);
        }

        updateLoadingStatus(message) {
            const status = document.getElementById('ai-summary-status');
            if (status) {
                status.textContent = message;
            }
        }

        removeLoadingIndicator() {
            const loader = document.getElementById('ai-summary-loading');
            if (loader) {
                loader.remove();
            }
        }
    }

    console.log('Content script loaded - creating new controller');
    window.navigoController = new ContentController();
}
