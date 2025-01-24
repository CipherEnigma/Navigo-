let tabStates = new Map();

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

function initializeExtension() {
  tabStates = new Map();
  
  const defaultState = {
    voiceActive: false,
    gestureActive: false,
    toolbarVisible: false
  };

  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      tabStates.set(tab.id, { ...defaultState });
    });
  });
}

chrome.tabs.onCreated.addListener((tab) => {
  tabStates.set(tab.id, {
    voiceActive: false,
    gestureActive: false,
    toolbarVisible: false
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const currentState = tabStates.get(tabId) || {
      voiceActive: false,
      gestureActive: false,
      toolbarVisible: false
    };

    if (currentState.voiceActive) {
      chrome.tabs.sendMessage(tabId, {
        action: 'startVoiceNavigation',
        state: true
      });
    }

    if (currentState.gestureActive) {
      chrome.tabs.sendMessage(tabId, {
        action: 'startGestureNavigation',
        state: true
      });
    }

    if (currentState.toolbarVisible) {
      chrome.tabs.sendMessage(tabId, {
        action: 'openToolbar',
        state: true
      });
    }
  }
});
