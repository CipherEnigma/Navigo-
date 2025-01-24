
class NavigationEngine {
    constructor() {
      this.currentFocusIndex = -1;
      this.interactiveElements = [];
      this.observer = null;
      this.setupMutationObserver();
      this.updateInteractiveElements();
    }
  
    setupMutationObserver() {
      this.observer = new MutationObserver(
        debounce(() => this.updateInteractiveElements(), 500)
      );
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  
    updateInteractiveElements() {
      const selector = `
        a, button, input, select, textarea,
        [role="button"],
        [role="link"],
        [role="checkbox"],
        [role="radio"],
        [role="tab"],
        [tabindex="0"]
      `;
  
      this.interactiveElements = Array.from(document.querySelectorAll(selector))
        .filter(element => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 rect.width > 0 && 
                 rect.height > 0;
        });
    }
  
    focusNext() {
      if (this.interactiveElements.length === 0) return;
      
      this.currentFocusIndex = (this.currentFocusIndex + 1) % this.interactiveElements.length;
      this.focusElement(this.currentFocusIndex);
    }
  
    focusPrevious() {
      if (this.interactiveElements.length === 0) return;
      
      this.currentFocusIndex = (this.currentFocusIndex - 1 + this.interactiveElements.length) % this.interactiveElements.length;
      this.focusElement(this.currentFocusIndex);
    }
  
    focusElement(index) {
      const element = this.interactiveElements[index];
      if (element) {
        element.focus();
        this.highlightElement(element);
        this.scrollIntoViewIfNeeded(element);
      }
    }
  
    highlightElement(element) {
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
        zIndex: '10000'
      });
  
      document.body.appendChild(highlight);
      setTimeout(() => highlight.remove(), 2000);
    }
  
    scrollIntoViewIfNeeded(element) {
      const rect = element.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  }
  
  
  const navigationEngine = new NavigationEngine();