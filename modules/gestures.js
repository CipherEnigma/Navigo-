export async function initializeGestures() {
    console.log('🎥 Starting camera initialization...');

    try {
        createControlPanel();
        
        showGestureFeedback('Click Start Camera to begin');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        showGestureFeedback('Error: ' + error.message);
        throw error;
    }
}

function createControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'camera-control-panel';
    controlPanel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(33, 150, 243, 0.95);
        padding: 15px;
        border-radius: 8px;
        z-index: 999997;
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
        color: white;
        min-width: 200px;
    `;

    const commandList = document.createElement('div');
    commandList.innerHTML = `
        <h3 style="margin: 0 0 10px 0; font-size: 14px;">Head Movement Controls:</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.4;">
            <li>Up ⬆️ = Scroll Up</li>
            <li>Down ⬇️ = Scroll Down</li>
            <li>Left ⬅️ = Previous Page</li>
            <li>Right ➡️ = Next Page</li>
        </ul>
    `;

    const startButton = document.createElement('button');
    startButton.id = 'camera-toggle-button';
    startButton.textContent = '📸 Start Camera';
    startButton.style.cssText = `
        padding: 10px 20px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        margin-top: 10px;
    `;

    const statusText = document.createElement('div');
    statusText.id = 'camera-status';
    statusText.textContent = 'Ready to start';
    statusText.style.cssText = `
        font-size: 12px;
        text-align: center;
        margin-top: 5px;
    `;

    controlPanel.appendChild(commandList);
    controlPanel.appendChild(startButton);
    controlPanel.appendChild(statusText);
    document.body.appendChild(controlPanel);

    let cameraActive = false;
    let videoElement = null;
    let stopTracking = null;
    let lastActionTime = 0;

    startButton.onclick = async () => {
        try {
            if (!cameraActive) {
                // Start camera
                statusText.textContent = 'Starting camera...';
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: 'user',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    }
                });

                // Create video element
                videoElement = document.createElement('video');
                videoElement.className = 'input_video';
                videoElement.autoplay = true;
                videoElement.playsInline = true;
                videoElement.muted = true;
                videoElement.style.cssText = `
                    position: fixed;
                    bottom: 300px;
                    right: 20px;
                    width: 320px;
                    height: 240px;
                    border-radius: 8px;
                    z-index: 999998;
                    transform: scaleX(-1);
                    border: 2px solid #4CAF50;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    background: #000;
                `;

                videoElement.srcObject = stream;
                document.body.appendChild(videoElement);
                await videoElement.play();

                startButton.textContent = '⏹️ Stop Camera';
                startButton.style.background = '#f44336';
                statusText.textContent = 'Camera Active';

                stopTracking = startMotionDetection(videoElement, statusText);
                cameraActive = true;

                showGestureFeedback('📸 Camera activated');
            } else {
                if (stopTracking) stopTracking();
                if (videoElement && videoElement.srcObject) {
                    videoElement.srcObject.getTracks().forEach(track => track.stop());
                    videoElement.remove();
                }
                
                startButton.textContent = '📸 Start Camera';
                startButton.style.background = '#4CAF50';
                statusText.textContent = 'Ready to start';
                cameraActive = false;

                showGestureFeedback('Camera stopped');
            }
        } catch (error) {
            console.error('Camera error:', error);
            statusText.textContent = 'Error: ' + error.message;
            showGestureFeedback('❌ ' + error.message);
            
            cameraActive = false;
            if (videoElement) videoElement.remove();
            startButton.textContent = '📸 Start Camera';
            startButton.style.background = '#4CAF50';
        }
    };
}

function startMotionDetection(videoElement, statusText) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    let previousPixel = null;
    let isTracking = true;
    let lastActionTime = 0;
    let verticalCount = 0;
    let horizontalCount = 0;
    let isScrolling = false;
    let scrollTimeout = null;
    let lastDirection = null;
    let gestureTimeout = null;
    let neutralPosition = null;
    let hasReturnedToNeutral = true;
    let lastVerticalPosition = 0;

    canvas.width = 10;
    canvas.height = 10;

    function smoothScroll(direction) {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        if (gestureTimeout) clearTimeout(gestureTimeout);
        
        const scrollAmount = direction * 300;
        window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
        });
        
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
            hasReturnedToNeutral = false;
        }, 400);
    }

    function detectMotion() {
        if (!isTracking || !videoElement.videoWidth) return;

        try {
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const frame = context.getImageData(0, 0, canvas.width, canvas.height).data;
            
            const centerY = Math.floor(canvas.height/2);
            const centerX = Math.floor(canvas.width/2);
            
            const topRegion = getRegionAverage(frame, centerX, centerY - 3);
            const bottomRegion = getRegionAverage(frame, centerX, centerY + 3);
            const leftRegion = getRegionAverage(frame, centerX - 3, centerY);
            const rightRegion = getRegionAverage(frame, centerX + 3, centerY);

            if (!neutralPosition) {
                neutralPosition = {
                    vertical: topRegion - bottomRegion,
                    horizontal: leftRegion - rightRegion
                };
                lastVerticalPosition = neutralPosition.vertical;
                return;
            }

            const verticalDiff = (topRegion - bottomRegion) - neutralPosition.vertical;
            const horizontalDiff = (leftRegion - rightRegion) - neutralPosition.horizontal;

            if (Math.abs(verticalDiff) < 10 && Math.abs(horizontalDiff) < 10) {
                hasReturnedToNeutral = true;
                verticalCount = 0;
                horizontalCount = 0;
                lastDirection = null;
                // Gradually update neutral position
                neutralPosition = {
                    vertical: neutralPosition.vertical * 0.8 + (topRegion - bottomRegion) * 0.2,
                    horizontal: neutralPosition.horizontal * 0.8 + (leftRegion - rightRegion) * 0.2
                };
            }

            const now = Date.now();
            if (now - lastActionTime > 250) {
                if (Math.abs(verticalDiff) > 25 && Math.abs(horizontalDiff) < 15) {
                    const currentDirection = verticalDiff < 0 ? 'up' : 'down'; // INVERTED
                    const significantChange = Math.abs(verticalDiff - lastVerticalPosition) > 10;
                    
                    if (significantChange || (lastDirection === currentDirection && !isScrolling)) {
                        if (lastDirection === currentDirection) {
                            verticalCount++;
                            if (verticalCount >= 2) {
                                lastActionTime = now;
                                isScrolling = true;
                                
                                if (currentDirection === 'down') {
                                    smoothScroll(1);
                                    showGestureFeedback('⬇️ Scrolling down');
                                } else {
                                    smoothScroll(-1);
                                    showGestureFeedback('⬆️ Scrolling up');
                                }
                            }
                        } else {
                            verticalCount = 1;
                            lastDirection = currentDirection;
                        }
                    }
                    lastVerticalPosition = verticalDiff;
                }
                // Handle horizontal navigation - requires very distinct sideways movement
                else if (Math.abs(horizontalDiff) > 40 && Math.abs(verticalDiff) < 10) {
                    const currentDirection = horizontalDiff > 0 ? 'right' : 'left';
                    
                    if (lastDirection === currentDirection) {
                        horizontalCount++;
                        
                        if (horizontalCount === 1) {
                            showGestureFeedback(`${currentDirection === 'right' ? '➡️' : '⬅️'} Keep turning...`);
                        }
                        
                        if (horizontalCount >= 8) {
                            lastActionTime = now;
                            horizontalCount = 0;
                            lastDirection = null;
                            
                            if (currentDirection === 'right') {
                                showGestureFeedback('➡️ Next page');
                                setTimeout(() => window.history.forward(), 500);
                            } else {
                                showGestureFeedback('⬅️ Previous page');
                                setTimeout(() => window.history.back(), 500);
                            }
                        }
                    } else {
                        horizontalCount = 1;
                        lastDirection = currentDirection;
                    }
                }
            }
            
            previousPixel = frame;
            
        } catch (error) {
            console.error('Motion detection error:', error);
        }
    }

    function getRegionAverage(frame, x, y) {
        const pixels = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const pos = ((y + i) * canvas.width + (x + j)) * 4;
                pixels.push(frame[pos]);
            }
        }
        return pixels.reduce((a, b) => a + b, 0) / pixels.length;
    }

    const runDetection = () => {
        detectMotion();
        if (isTracking) {
            requestAnimationFrame(runDetection);
        }
    };
    requestAnimationFrame(runDetection);

    return () => {
        isTracking = false;
        if (scrollTimeout) clearTimeout(scrollTimeout);
        if (gestureTimeout) clearTimeout(gestureTimeout);
    };
}

function calculateMovement(prev, curr) {
    const width = prev.width;
    const height = prev.height;
    const prevData = prev.data;
    const currData = curr.data;
    
    let diffX = 0;
    let diffY = 0;
    let changes = 0;
    
    // Sample fewer pixels for faster processing
    const sampleSize = 10; // Check every 10th pixel
    
    for (let y = 0; y < height; y += sampleSize) {
        for (let x = 0; x < width; x += sampleSize) {
            const offset = (y * width + x) * 4;
            
            const prevBrightness = (prevData[offset] + prevData[offset + 1] + prevData[offset + 2]) / 3;
            const currBrightness = (currData[offset] + currData[offset + 1] + currData[offset + 2]) / 3;
            
            if (Math.abs(prevBrightness - currBrightness) > 20) {
                diffX += x - (width / 2);
                diffY += y - (height / 2);
                changes++;
            }
        }
    }
    
    return {
        x: changes > 0 ? diffX / changes : 0,
        y: changes > 0 ? diffY / changes : 0
    };
}

function focusNextElement() {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    const nextElement = focusableElements[nextIndex];
    nextElement.focus();
    // Add visual feedback
    nextElement.style.outline = '2px solid #4CAF50';
    nextElement.style.transition = 'all 0.3s';
    setTimeout(() => {
        nextElement.style.outline = '';
    }, 1000);
    return nextElement;
}

function focusPreviousElement() {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    const prevIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
    const prevElement = focusableElements[prevIndex];
    prevElement.focus();
    prevElement.style.outline = '2px solid #4CAF50';
    prevElement.style.transition = 'all 0.3s';
    setTimeout(() => {
        prevElement.style.outline = '';
    }, 1000);
    return prevElement;
}

function clickFocusedElement() {
    const focused = document.activeElement;
    if (focused && focused !== document.body) {
        focused.click();
    }
}

function getFocusableElements() {
    const elements = Array.from(document.querySelectorAll(`
        a[href]:not([disabled]), 
        button:not([disabled]), 
        input:not([disabled]), 
        select:not([disabled]), 
        textarea:not([disabled]), 
        [tabindex]:not([tabindex="-1"]):not([disabled]),
        iframe,
        object,
        embed,
        [contenteditable="true"]
    `));

    return elements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               el.offsetWidth > 0 &&
               el.offsetHeight > 0;
    });
}

function showGestureFeedback(message) {
    console.log('Showing feedback:', message);
    
    // Remove any existing feedback
    const existingFeedback = document.querySelector('.gesture-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    const feedback = document.createElement('div');
    feedback.className = 'gesture-feedback';
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 999999;
        font-family: Arial, sans-serif;
        animation: fadeInOut 0.5s ease-in-out;
        max-width: 300px;
        text-align: center;
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'fadeOut 0.5s ease-in-out';
        setTimeout(() => feedback.remove(), 500);
    }, 2500);
}

// Export the main function
export { initializeGestures, showGestureFeedback };

// Add styles if not already present
if (!document.getElementById('gesture-feedback-styles')) {
    const style = document.createElement('style');
    style.id = 'gesture-feedback-styles';
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
        }
    `;
    document.head.appendChild(style);
}
