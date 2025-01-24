document.addEventListener("DOMContentLoaded", () => {

    const selector = document.getElementById('languageSelector');
            
    // Sort languages alphabetically
    const sortedLanguages = Object.keys(langCodes).sort();
    
    // Create default option
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select Language';
    defaultOption.value = '';
    selector.appendChild(defaultOption);

    // Populate dropdown with languages
    sortedLanguages.forEach(language => {
        const option = document.createElement('option');
        option.value = langCodes[language];
        option.textContent = language;
        selector.appendChild(option);
    });

    // Set default to English
    selector.value = 'en';

    // Handle Back Button Click
    const backButton = document.querySelector("a[href='popup/popup.html']");
    backButton.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = backButton.getAttribute("href");
    });

    // Handle Voice Selection
    const voiceSelect = document.querySelector("select");
    voiceSelect.addEventListener("change", (event) => {
        const selectedVoice = event.target.value;
        console.log(`Voice changed to: ${selectedVoice}`);
        // Add logic to update speech synthesis voice
    });

    // Handle Speech Rate Change
    const speechRateSlider = document.querySelector("input[type='range']");
    speechRateSlider.addEventListener("input", (event) => {
        const speechRate = event.target.value;
        console.log(`Speech rate adjusted to: ${speechRate}`);
        // Add logic to apply the speech rate to the text-to-speech system
    });

    // Handle Gesture Calibration Button Click
    const calibrateButton = document.querySelector("button");
    calibrateButton.addEventListener("click", () => {
        console.log("Gesture calibration started.");
        // Add logic for gesture calibration
    });

    // Shortcut Commands Listeners
    const shortcutCommands = [
        {
            command: "start",
            action: () => {
                console.log("Speech-to-Text enabled.");
                // Add logic to start speech-to-text
            },
        },
        {
            command: "stop",
            action: () => {
                console.log("Speech-to-Text disabled.");
                // Add logic to stop speech-to-text
            },
        },
    ];

    // Simulate Voice Commands for Demonstration
    function simulateVoiceCommand(command) {
        const matchedCommand = shortcutCommands.find(
            (shortcut) => shortcut.command.toLowerCase() === command.toLowerCase()
        );
        if (matchedCommand) {
            matchedCommand.action();
        } else {
            console.log(`Unknown command: ${command}`);
        }
    }

    // Example: Simulate voice commands on page load for testing
    console.log("Simulating voice commands: 'start', 'stop'.");
    simulateVoiceCommand("start");
    simulateVoiceCommand("stop");



});
