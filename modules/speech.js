class SpeechController {
    constructor() {
        console.log('Initializing SpeechController');
        this.recognition = null;
        this.isListening = false;
        this.commands = {
            'scroll down': () => window.scrollBy(0, 300),
            'scroll up': () => window.scrollBy(0, -300),
            'go back': () => window.history.back(),
            'go forward': () => window.history.forward()
        };
        this.initialize();
    }

    initialize() {
        try {
            if (!('webkitSpeechRecognition' in window)) {
                throw new Error('Speech recognition not supported in this browser');
            }

            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                console.log('Speech recognition started');
                this.isListening = true;
            };

            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                this.isListening = false;
                // Restart if was listening
                if (this.isListening) {
                    this.recognition.start();
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };

            this.recognition.onresult = (event) => {
                const last = event.results.length - 1;
                const command = event.results[last][0].transcript.trim().toLowerCase();
                console.log('Command recognized:', command);

                if (this.commands[command]) {
                    this.commands[command]();
                }
            };

        } catch (error) {
            console.error('Speech initialization error:', error);
            throw error;
        }
    }

    start() {
        if (!this.recognition) {
            throw new Error('Speech recognition not initialized');
        }
        
        try {
            this.recognition.start();
            console.log('Started listening');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            throw error;
        }
    }

    stop() {
        if (this.recognition) {
            this.recognition.stop();
            this.isListening = false;
            console.log('Stopped listening');
        }
    }

    addCommand(command, action) {
        this.commands[command.toLowerCase()] = action;
    }

    removeCommand(command) {
        delete this.commands[command.toLowerCase()];
    }
}

window.SpeechController = SpeechController;
