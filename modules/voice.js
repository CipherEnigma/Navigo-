import commandProcessor from './CommandProcessor.js';
import Feedback from './Feedback.js';

class VoiceRecognition {
  constructor() {
    this.recognition = new webkitSpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.isListening = false;
    this.setupRecognition();
  }

  setupRecognition() {
    this.recognition.onstart = () => {
      this.isListening = true;
      Feedback.showFeedback('Listening...');
    };

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      if (event.results[0].isFinal) {
        this.processVoiceCommand(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      Feedback.showFeedback('Error: ' + event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (commandProcessor.isListening) {
        this.start();
      }
    };
  }

  async processVoiceCommand(transcript) {
    Feedback.showFeedback('Processing: ' + transcript);

    if (transcript.includes('go to')) {
      const url = transcript.split('go to')[1].trim();
      if (url) {
        window.location.href = `https://${url}`;
        return;
      }
    }

    await commandProcessor.processCommand(transcript);
  }

  start() {
    if (!this.isListening) {
      this.recognition.start();
      commandProcessor.startListening();
    }
  }

  stop() {
    if (this.isListening) {
      this.recognition.stop();
      commandProcessor.stopListening();
      Feedback.showFeedback('Voice recognition stopped');
    }
  }

  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }
}

export default new VoiceRecognition();