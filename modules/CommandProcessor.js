import { summarizePage, summarizeText } from './aisummarizer.js';
import Feedback from './feedback.js';

class CommandProcessor {
  constructor() {
    this.commands = new Map();
  }

  registerCommand(command, handler) {
    this.commands.set(command.toLowerCase(), handler);
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
}

const commandProcessor = new CommandProcessor();

// Register commands
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
