let tabStates = new Map();

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
  initializeExtension();
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
  
  if (request.action === 'updateTabState' && sender.tab) {
    const tabId = sender.tab.id;
    const currentState = tabStates.get(tabId) || {};
    tabStates.set(tabId, { ...currentState, ...request.state });
    sendResponse({ success: true });
  }
  
  if (request.action === 'getTabState' && sender.tab) {
    const tabId = sender.tab.id;
    const state = tabStates.get(tabId) || {
      voiceActive: false,
      gestureActive: false,
      toolbarVisible: false
    };
    sendResponse({ state });
  }

  // Handle gesture calibration settings
  if (request.action === 'saveGestureConfig') {
    chrome.storage.local.set({ gestureConfig: request.config }, () => {
      sendResponse({ success: true });
    });
  }

  if (request.action === 'loadGestureConfig') {
    chrome.storage.local.get(['gestureConfig'], (result) => {
      sendResponse({ config: result.gestureConfig || null });
    });
  }
  
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    const currentState = tabStates.get(tabId) || {
      voiceActive: false,
      gestureActive: false,
      toolbarVisible: false
    };

    // Inject content script if needed
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content/content.js']
    }).catch(() => {
      // Ignore errors for pages where we can't inject
    });

    // Restore states after a delay to ensure content script is loaded
    setTimeout(() => {
      if (currentState.voiceActive) {
        chrome.tabs.sendMessage(tabId, {
          action: 'startVoiceNavigation',
          state: true
        }).catch(() => {});
      }

      if (currentState.gestureActive) {
        chrome.tabs.sendMessage(tabId, {
          action: 'startGestureNavigation',
          state: true
        }).catch(() => {});
      }

      if (currentState.toolbarVisible) {
        chrome.tabs.sendMessage(tabId, {
          action: 'openToolbar',
          state: true
        }).catch(() => {});
      }
    }, 500);
  }
});
