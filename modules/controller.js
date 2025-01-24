// Maintain state for each tab
let tabStates = new Map();

// Handle extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  initializeExtension();
});

// Initialize extension settings and state
function initializeExtension() {
  // Reset tab states
  tabStates = new Map();
  
  // Set default states for voice and gesture navigation
  const defaultState = {
    voiceActive: false,
    gestureActive: false,
    toolbarVisible: false
  };

  // Apply to all existing tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      tabStates.set(tab.id, { ...defaultState });
    });
  });
}

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
  tabStates.set(tab.id, {
    voiceActive: false,
    gestureActive: false,
    toolbarVisible: false
  });
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

// Main message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    const currentTab = tabs[0];
    let tabState = tabStates.get(currentTab.id) || {
      voiceActive: false,
      gestureActive: false,
      toolbarVisible: false
    };

    switch (request.action) {
      case 'startVoiceNavigation':
        tabState.voiceActive = request.state;
        tabStates.set(currentTab.id, tabState);
        chrome.tabs.sendMessage(currentTab.id, {
          action: 'startVoiceNavigation',
          state: tabState.voiceActive
        });
        sendResponse({ success: true, active: tabState.voiceActive });
        break;

      case 'startGestureNavigation':
        tabState.gestureActive = request.state;
        tabStates.set(currentTab.id, tabState);
        chrome.tabs.sendMessage(currentTab.id, {
          action: 'startGestureNavigation',
          state: tabState.gestureActive
        });
        sendResponse({ success: true, active: tabState.gestureActive });
        break;

      case 'summarizePage':
        chrome.tabs.sendMessage(currentTab.id, { action: 'summarizePage' }, (response) => {
          sendResponse({ success: true, summary: response.summary });
        });
        return true;

      case 'openToolbar':
        tabState.toolbarVisible = true;
        tabStates.set(currentTab.id, tabState);
        chrome.tabs.sendMessage(currentTab.id, { action: 'openToolbar' });
        sendResponse({ success: true, visible: tabState.toolbarVisible });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  });

  return true;
});

// Handle tab updates to reapply state
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