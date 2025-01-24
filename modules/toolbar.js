document.addEventListener('DOMContentLoaded', () => {
    const startVoiceNavigation = document.getElementById('startVoiceNavigation');
    const startGestureNavigation = document.getElementById('startGestureNavigation');
    const startSummarization = document.getElementById('startSummarization');
    const closeToolbar = document.getElementById('closeToolbar');
    const summaryContainer = document.getElementById('summaryContainer');
    const summaryText = document.getElementById('summaryText');
  
    let isVoiceActive = false;
    let isGestureActive = false;
  
    startVoiceNavigation.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'startVoiceNavigation' }, (response) => {
        if (response && response.success) {
          isVoiceActive = !isVoiceActive;
          updateButtonState(startVoiceNavigation, isVoiceActive);
        }
      });
    });
  
    startGestureNavigation.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'startGestureNavigation' }, (response) => {
        if (response && response.success) {
          isGestureActive = !isGestureActive;
          updateButtonState(startGestureNavigation, isGestureActive);
        }
      });
    });
  
    startSummarization.addEventListener('click', () => {
      startSummarization.disabled = true;
      startSummarization.textContent = 'Summarizing...';
  
      chrome.runtime.sendMessage({ action: 'summarizePage' }, (response) => {
        startSummarization.disabled = false;
        startSummarization.textContent = 'Start AI Summarization';
  
        if (response && response.summary) {
          summaryText.value = response.summary;
          summaryContainer.style.display = 'block';
        }
      });
    });
  
    closeToolbar.addEventListener('click', () => {
      document.getElementById('toolbar').remove();
    });
  
    function updateButtonState(button, isActive) {
      if (isActive) {
        button.classList.add('active');
        button.textContent = `Stop ${button.dataset.feature}`;
      } else {
        button.classList.remove('active');
        button.textContent = `Start ${button.dataset.feature}`;
      }
    }
  });
