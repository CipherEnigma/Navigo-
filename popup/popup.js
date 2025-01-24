document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded');
    
    const voiceToggle = document.getElementById('voiceToggle');
    const gestureToggle = document.getElementById('gestureToggle');
    const summarizationToggle = document.getElementById('summarizationToggle');
    const toolbarBtn = document.getElementById('toolbarBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const feedbackBtn = document.getElementById('feedbackBtn');
    const helpBtn = document.getElementById('helpBtn');

    toolbarBtn?.addEventListener('click', () => {
        console.log('Toolbar button clicked');
        
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (!tabs[0]?.id) return;
            
            try {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'openToolbar' }, (response) => {
                    if (chrome.runtime.lastError) {
                        // If content script is not loaded, inject it
                        chrome.scripting.executeScript({
                            target: { tabId: tabs[0].id },
                            files: ['content/content.js']
                        }).then(() => {
                            // Try sending the message again after injection
                            chrome.tabs.sendMessage(tabs[0].id, { action: 'openToolbar' });
                        });
                    }
                });
                window.close();
            } catch (error) {
                console.error('Error:', error);
                alert('Cannot open toolbar on this page. Please try another page.');
            }
        });
    });

    // Voice toggle handler
    voiceToggle?.addEventListener('change', async (e) => {
        if (e.target.checked) {
            await requestMicrophonePermission();
            sendMessageToActiveTab({ action: 'startVoiceNavigation', state: true });
        } else {
            sendMessageToActiveTab({ action: 'startVoiceNavigation', state: false });
        }
    });

    gestureToggle?.addEventListener('change', async (e) => {
        if (e.target.checked) {
            await requestCameraPermission();
            sendMessageToActiveTab({ action: 'startGestureNavigation', state: true });
        } else {
            sendMessageToActiveTab({ action: 'startGestureNavigation', state: false });
        }
    });

    summarizationToggle?.addEventListener('change', (e) => {
        sendMessageToActiveTab({ action: 'summarizePage', state: e.target.checked });
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
});

async function requestMicrophonePermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted');
    } catch (error) {
        console.error('Microphone access denied:', error);
        alert('Microphone access is required for voice navigation.');
    }
}

async function requestCameraPermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Camera access granted');
    } catch (error) {
        console.error('Camera access denied:', error);
        alert('Camera access is required for gesture navigation.');
    }
}

function sendMessageToActiveTab(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, message);
        }
    });
}
