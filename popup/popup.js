// Select the toggle buttons
const voiceToggle = document.getElementById('voiceToggle');
const gestureToggle = document.getElementById('gestureToggle');
const summarizationToggle = document.getElementById('summarizationToggle');

// Function to request microphone permission
async function requestMicrophonePermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted');
        alert('Microphone access granted.');
    } catch (error) {
        console.error('Microphone access denied:', error);
        alert('Microphone access denied. Please allow access in browser settings.');
    }
}

// Function to request camera permission
async function requestCameraPermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Camera access granted');
        alert('Camera access granted.');
    } catch (error) {
        console.error('Camera access denied:', error);
        alert('Camera access denied. Please allow access in browser settings.');
    }
}

// Function to simulate browser permissions
function requestBrowserPermission() {
    console.log('Browser permission simulated');
    alert('Browser access permission requested.');
}

// Event listeners for toggle buttons
voiceToggle.addEventListener('change', async (e) => {
    if (e.target.checked) {
        console.log('Voice Recognition: ON');
        await requestMicrophonePermission();
        chrome.runtime.sendMessage({ action: 'startVoiceNavigation', state: true });
    } else {
        console.log('Voice Recognition: OFF');
        chrome.runtime.sendMessage({ action: 'startVoiceNavigation', state: false });
    }
});

gestureToggle.addEventListener('change', async (e) => {
    if (e.target.checked) {
        console.log('Gesture Recognition: ON');
        await requestCameraPermission();
        chrome.runtime.sendMessage({ action: 'startGestureNavigation', state: true });
    } else {
        console.log('Gesture Recognition: OFF');
        chrome.runtime.sendMessage({ action: 'startGestureNavigation', state: false });
    }
});

summarizationToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        console.log('AI Summarization: ON');
        requestBrowserPermission();
        chrome.runtime.sendMessage({ action: 'summarizePage', state: true });
    } else {
        console.log('AI Summarization: OFF');
        chrome.runtime.sendMessage({ action: 'summarizePage', state: false });
    }
});

// Select other buttons
const dashboardBtn = document.getElementById('dashboardBtn');
const feedbackBtn = document.getElementById('feedbackBtn');
const helpBtn = document.getElementById('helpBtn');
const toolbarBtn = document.getElementById('toolbarBtn');

// Dashboard button click
dashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
});

// Feedback button click
feedbackBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('module/feedback.js') });
});

// Help button click
helpBtn.addEventListener('click', () => {
    alert('Visit the documentation or contact support for help.');
});

// Toolbar button click
if (toolbarBtn) {
    toolbarBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'openToolbar' });
            }
        });
    });
} else {
    console.error("Element #toolbarBtn not found.");
}
