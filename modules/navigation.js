class NavigationEngine {
  constructor() {
    console.log('NavigationEngine: Initializing...');
    this.currentFocusIndex = -1;
    this.interactiveElements = [];
    this.observer = null;
    this.setupMutationObserver();
    this.updateInteractiveElements();
  }

  setupMutationObserver() {
    console.log('Setting up mutation observer');
    this.observer = new MutationObserver(
      this.debounce(() => {
        console.log('DOM mutation detected, updating elements');
        this.updateInteractiveElements();
      }, 500)
    );
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'hidden', 'disabled']
    });
  }

  updateInteractiveElements() {
    console.log('Updating interactive elements');
    const selector = `
      a[href]:not([disabled]),
      button:not([disabled]),
      input:not([disabled]):not([type="hidden"]),
      select:not([disabled]),
      textarea:not([disabled]),
      [role="button"]:not([disabled]),
      [role="link"]:not([disabled]),
      [role="checkbox"]:not([disabled]),
      [role="radio"]:not([disabled]),
      [role="tab"]:not([disabled]),
      [tabindex="0"]
    `;

    const elements = Array.from(document.querySelectorAll(selector));
    this.interactiveElements = elements.filter(element => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const isVisible = style.display !== 'none' && 
                      style.visibility !== 'hidden' && 
                      rect.width > 0 && 
                      rect.height > 0;
      
      const isInViewport = rect.top >= 0 &&
                         rect.left >= 0 &&
                         rect.bottom <= window.innerHeight &&
                         rect.right <= window.innerWidth;

      return isVisible && isInViewport;
    });

    console.log(`Found ${this.interactiveElements.length} interactive elements`);
  }

  focusNext() {
    if (this.interactiveElements.length === 0) {
      console.log('No interactive elements found');
      return;
    }
    
    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.interactiveElements.length;
    console.log(`Focusing next element (${this.currentFocusIndex + 1}/${this.interactiveElements.length})`);
    this.focusElement(this.currentFocusIndex);
  }

  focusPrevious() {
    if (this.interactiveElements.length === 0) {
      console.log('No interactive elements found');
      return;
    }
    
    this.currentFocusIndex = (this.currentFocusIndex - 1 + this.interactiveElements.length) % this.interactiveElements.length;
    console.log(`Focusing previous element (${this.currentFocusIndex + 1}/${this.interactiveElements.length})`);
    this.focusElement(this.currentFocusIndex);
  }

  focusElement(index) {
    const element = this.interactiveElements[index];
    if (element) {
      element.focus();
      this.highlightElement(element);
      this.scrollIntoViewIfNeeded(element);
      console.log('Focused element:', element.tagName, element.textContent?.trim());
    }
  }

  highlightElement(element) {
    document.querySelectorAll('.navigator-highlight').forEach(el => el.remove());

    const highlight = document.createElement('div');
    highlight.className = 'navigator-highlight';
    const rect = element.getBoundingClientRect();
    
    Object.assign(highlight.style, {
      position: 'fixed',
      top: `${rect.top - 4}px`,
      left: `${rect.left - 4}px`,
      width: `${rect.width + 8}px`,
      height: `${rect.height + 8}px`,
      border: '2px solid #4CAF50',
      borderRadius: '4px',
      pointerEvents: 'none',
      zIndex: '10000',
      animation: 'highlight-pulse 1s ease-in-out'
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes highlight-pulse {
        0% { transform: scale(1.1); opacity: 0; }
        50% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(highlight);
    setTimeout(() => {
      highlight.remove();
      style.remove();
    }, 1000);
  }

  scrollIntoViewIfNeeded(element) {
    const rect = element.getBoundingClientRect();
    const isInViewport = rect.top >= 0 &&
                       rect.left >= 0 &&
                       rect.bottom <= window.innerHeight &&
                       rect.right <= window.innerWidth;

    if (!isInViewport) {
      console.log('Scrolling element into view');
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  refresh() {
    console.log('Manually refreshing interactive elements');
    this.updateInteractiveElements();
  }
}

console.log('Initializing NavigationEngine');
const navigationEngine = new NavigationEngine();

window.navigationEngine = navigationEngine;
