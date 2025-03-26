class VoiceController {
    constructor() {
        this.isActive = false;
        this.recognition = null;
    }

    toggle(state) {
        if (state) {
            this.start();
        } else {
            this.stop();
        }
    }

    start() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            throw new Error('Speech recognition not supported');
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            this.processCommand(command);
        };

        this.recognition.onend = () => {
            if (this.isActive) {
                this.recognition.start();
            }
        };

        this.recognition.start();
        this.isActive = true;
        console.log('Voice recognition started');
    }

    processCommand(command) {
        const commands = {
            'scroll up': () => window.scrollBy({ top: -300, behavior: 'smooth' }),
            'scroll down': () => window.scrollBy({ top: 300, behavior: 'smooth' }),
            'go back': () => window.history.back(),
            'go forward': () => window.history.forward()
        };

        for (const [key, action] of Object.entries(commands)) {
            if (command.includes(key)) {
                action();
                console.log('Voice command executed:', key);
                return;
            }
        }
    }

    stop() {
        this.isActive = false;
        if (this.recognition) {
            this.recognition.stop();
        }
    }
}

window.NavigoVoiceController = VoiceController;

