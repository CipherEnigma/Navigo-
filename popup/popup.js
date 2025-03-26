document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded');
    
    const voiceToggle = document.getElementById('voiceToggle');
    const gestureToggle = document.getElementById('gestureToggle');
    const summarizationToggle = document.getElementById('summarizationToggle');
    const toolbarBtn = document.getElementById('toolbarBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const feedbackBtn = document.getElementById('feedbackBtn');
    const helpBtn = document.getElementById('helpBtn');

    // Load current states when popup opens
    loadCurrentStates();

    toolbarBtn?.addEventListener('click', async () => {
        console.log('Toolbar button clicked');
        
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id) return;
            
            const tabId = tabs[0].id;
            
            // Check if we can access this tab
            if (tabs[0].url.startsWith('chrome://') || tabs[0].url.startsWith('chrome-extension://')) {
                alert('Cannot access this page. Please try on a regular website.');
                return;
            }

            // Ensure content script is injected
            await ensureContentScriptInjected(tabId);
            
            // Send message to open toolbar
            await chrome.tabs.sendMessage(tabId, { action: 'openToolbar' });
            
            window.close();
        } catch (error) {
            console.error('Error:', error);
            alert('Cannot open toolbar on this page. Please try another page.');
        }
    });

    // Voice toggle handler
    voiceToggle?.addEventListener('change', async (e) => {
        try {
            if (e.target.checked) {
                const hasPermission = await requestMicrophonePermission();
                if (!hasPermission) {
                    e.target.checked = false;
                    return;
                }
            }
            
            await sendMessageToActiveTab({ 
                action: 'startVoiceNavigation', 
                state: e.target.checked 
            });
            
            // Update background state
            updateTabState({ voiceActive: e.target.checked });
        } catch (error) {
            console.error('Voice toggle error:', error);
            e.target.checked = false;
        }
    });

    gestureToggle?.addEventListener('change', async (e) => {
        try {
            console.log('Gesture toggle clicked, state:', e.target.checked);
            
            if (e.target.checked) {
                console.log('Requesting camera permission...');
                const hasPermission = await requestCameraPermission();
                if (!hasPermission) {
                    console.log('Camera permission denied');
                    e.target.checked = false;
                    return;
                }
                console.log('Camera permission granted');
            }
            
            console.log('Sending gesture navigation message...');
            await sendMessageToActiveTab({ 
                action: 'startGestureNavigation', 
                state: e.target.checked 
            });
            console.log('Message sent successfully');
            
            // Update background state
            updateTabState({ gestureActive: e.target.checked });
        } catch (error) {
            console.error('Gesture toggle error:', error);
            alert('Gesture navigation failed: ' + error.message);
            e.target.checked = false;
        }
    });

    summarizationToggle?.addEventListener('change', async (e) => {
        try {
            await sendMessageToActiveTab({ 
                action: 'summarizePage', 
                state: e.target.checked 
            });
        } catch (error) {
            console.error('Summarization toggle error:', error);
        }
    });

    dashboardBtn?.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    });

    feedbackBtn?.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('feedback.html') });
    });

    helpBtn?.addEventListener('click', () => {
        alert('Visit the documentation or contact support for help.');
    });

    async function loadCurrentStates() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getTabState' });
            if (response?.state) {
                if (voiceToggle) voiceToggle.checked = response.state.voiceActive;
                if (gestureToggle) gestureToggle.checked = response.state.gestureActive;
            }
        } catch (error) {
            console.log('Could not load current states:', error);
        }
    }

    async function updateTabState(state) {
        try {
            await chrome.runtime.sendMessage({ 
                action: 'updateTabState', 
                state: state 
            });
        } catch (error) {
            console.error('Could not update tab state:', error);
        }
    }
});

async function requestMicrophonePermission() {
    try {
        // Create a temporary audio element to test permission
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            await chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: async () => {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        stream.getTracks().forEach(track => track.stop());
                        return true;
                    } catch (error) {
                        throw new Error('Microphone access denied');
                    }
                }
            });
        }
        console.log('Microphone access granted');
        return true;
    } catch (error) {
        console.error('Microphone access denied:', error);
        alert('Microphone access is required for voice navigation. Please allow microphone access in your browser settings.');
        return false;
    }
}

async function requestCameraPermission() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            const result = await chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: async () => {
                    try {
                        // Request camera permission
                        const stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { 
                                width: { ideal: 640 },
                                height: { ideal: 480 },
                                facingMode: 'user'
                            } 
                        });
                        
                        // Test that we can access the camera
                        const videoTrack = stream.getVideoTracks()[0];
                        if (videoTrack) {
                            console.log('Camera capabilities:', videoTrack.getCapabilities());
                        }
                        
                        // Stop the stream since we'll restart it in gesture recognition
                        stream.getTracks().forEach(track => track.stop());
                        
                        return { success: true, message: 'Camera access granted' };
                    } catch (error) {
                        console.error('Camera access error:', error);
                        return { success: false, error: error.message };
                    }
                }
            });
            
            if (result[0].result.success) {
                console.log('Camera access granted');
                return true;
            } else {
                throw new Error(result[0].result.error);
            }
        }
        return false;
    } catch (error) {
        console.error('Camera access denied:', error);
        alert('Camera access is required for gesture navigation. Please allow camera access and ensure you have a working camera.');
        return false;
    }
}

async function ensureContentScriptInjected(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content/content.js']
        });
    } catch (error) {
        // Content script might already be injected, ignore error
        console.log('Content script injection result:', error.message);
    }
}

async function sendMessageToActiveTab(message) {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]?.id) {
            throw new Error('No active tab found');
        }
        
        const tab = tabs[0];
        
        // Check if we can access this tab
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
            throw new Error('Cannot access browser internal pages');
        }
        
        console.log('Ensuring content script is injected...');
        await ensureContentScriptInjected(tab.id);
        
        console.log('Sending message to tab:', message);
        const response = await chrome.tabs.sendMessage(tab.id, message);
        console.log('Message response:', response);
        
        return response;
    } catch (error) {
        console.error('Error sending message to tab:', error);
        throw error;
    }
}
