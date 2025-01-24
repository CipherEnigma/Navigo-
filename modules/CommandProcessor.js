import { summarizePage, summarizeText } from './aisummarizer.js';
import Feedback from './feedback.js';

class CommandProcessor {
  constructor() {
    this.commands = new Map();
    this.initializeSearchOverlay();
  }

  registerCommand(command, handler) {
    this.commands.set(command.toLowerCase(), handler);
  }

  processCommand(transcript) {
    console.log('Processing command:', transcript);
    
    for (const [command, handler] of Object.entries(this.commands)) {
        console.log('Checking command:', command);
        
        if (transcript.toLowerCase().includes(command)) {
            console.log('Command matched:', command);
            handler(transcript);
            return true;
        }
    }
    
    console.warn('Command not recognized:', transcript);
    return false;
}
  async processCommand(command) {
    command = command.toLowerCase();
    for (let [key, handler] of this.commands) {
      if (command.includes(key)) {
        await handler(command);
        Feedback.showFeedback(`Executing: ${key}`, 'info');
        return true;
      }
    }
    return false;
  }

  initializeSearchOverlay() {
    // Add search-related commands
    this.registerCommand('search for', this.performSearch.bind(this));
    this.registerCommand('find', this.performSearch.bind(this));
    this.registerCommand('search page', this.performSearch.bind(this));
  }

  performSearch(command) {
    // Extract search query
    const searchCommands = ['search for', 'find', 'search page'];
    let searchQuery = command;
    
    for (const cmd of searchCommands) {
      if (searchQuery.startsWith(cmd)) {
        searchQuery = searchQuery.substring(cmd.length).trim();
        break;
      }
    }

    if (!searchQuery) {
      Feedback.showFeedback('No search term provided', 'error');
      return;
    }

    // Create or show search overlay
    let searchOverlay = document.getElementById('navigo-search-overlay');
    if (!searchOverlay) {
      searchOverlay = this.createSearchOverlay();
    }
    
    // Perform page search
    this.searchPage(searchQuery, searchOverlay);
  }

  createSearchOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'navigo-search-overlay';
    overlay.innerHTML = `
      <div class="search-container">
        <div class="search-header">
          <span class="result-count"></span>
          <button class="close-search">×</button>
        </div>
        <div class="search-results"></div>
        <div class="search-controls">
          <button class="prev-result">Previous</button>
          <button class="next-result">Next</button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #navigo-search-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2c2c2c;
        border-radius: 8px;
        padding: 15px;
        z-index: 10000;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
        min-width: 300px;
      }
      .search-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .search-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .close-search {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
      }
      .search-results {
        max-height: 200px;
        overflow-y: auto;
        margin: 10px 0;
      }
      .search-controls {
        display: flex;
        gap: 10px;
      }
      .search-controls button {
        padding: 5px 10px;
        border: none;
        border-radius: 4px;
        background: #4CAF50;
        color: white;
        cursor: pointer;
      }
      .search-match {
        background: yellow;
        color: black;
      }
      .search-match.current {
        background: #ff9800;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    // Add close button functionality
    const closeButton = overlay.querySelector('.close-search');
    closeButton.onclick = () => {
      this.clearSearchHighlights();
      overlay.remove();
    };

    return overlay;
  }

  searchPage(query, overlay) {
    // Clear previous search highlights
    this.clearSearchHighlights();

    const matches = [];
    let currentIndex = -1;

    // Find all matches
    const regex = new RegExp(query, 'gi');
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      const nodeText = node.textContent;
      let match;
      while ((match = regex.exec(nodeText)) !== null) {
        matches.push({
          node: node,
          index: match.index,
          text: match[0]
        });
      }
    }

    // Update UI
    const resultCount = overlay.querySelector('.result-count');
    resultCount.textContent = `${matches.length} matches found`;

    // Highlight matches
    matches.forEach((match, idx) => {
      const range = document.createRange();
      range.setStart(match.node, match.index);
      range.setEnd(match.node, match.index + match.text.length);
      
      const highlight = document.createElement('span');
      highlight.className = 'search-match';
      highlight.textContent = match.text;
      range.deleteContents();
      range.insertNode(highlight);
    });

    // Add navigation controls
    const prevButton = overlay.querySelector('.prev-result');
    const nextButton = overlay.querySelector('.next-result');

    const highlightCurrent = () => {
      document.querySelectorAll('.search-match.current').forEach(el => {
        el.classList.remove('current');
      });
      
      const currentMatch = matches[currentIndex];
      const element = document.querySelectorAll('.search-match')[currentIndex];
      if (element) {
        element.classList.add('current');
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    };

    prevButton.onclick = () => {
      if (matches.length === 0) return;
      currentIndex = (currentIndex - 1 + matches.length) % matches.length;
      highlightCurrent();
    };

    nextButton.onclick = () => {
      if (matches.length === 0) return;
      currentIndex = (currentIndex + 1) % matches.length;
      highlightCurrent();
    };

    // Initial highlight
    if (matches.length > 0) {
      currentIndex = 0;
      highlightCurrent();
    }
  }

  clearSearchHighlights() {
    document.querySelectorAll('.search-match').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
    });
  }
}

const commandProcessor = new CommandProcessor();

// Existing commands
commandProcessor.registerCommand('scroll down', () => window.scrollBy(0, 200));
commandProcessor.registerCommand('scroll up', () => window.scrollBy(0, -200));
commandProcessor.registerCommand('click', () => {
  const focusedElement = document.querySelector(':focus');
  if (focusedElement) {
    focusedElement.click();
  }
});
commandProcessor.registerCommand('go back', () => history.back());
commandProcessor.registerCommand('go forward', () => history.forward());
commandProcessor.registerCommand('summarize page', async () => {
  const summary = await summarizePage();
  Feedback.showPopup('Page Summary', summary);
});
commandProcessor.registerCommand('summarize selection', async () => {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    const summary = await summarizeText(selectedText);
    Feedback.showPopup('Selection Summary', summary);
  } else {
    alert('No text selected!');
  }
});

export default commandProcessor;