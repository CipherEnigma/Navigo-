document.addEventListener("DOMContentLoaded", () => {
    console.log('Dashboard loaded');

    // Language codes mapping
    const langCodes = {
        'English': 'en',
        'Spanish': 'es',
        'French': 'fr',
        'German': 'de',
        'Italian': 'it',
        'Portuguese': 'pt',
        'Chinese': 'zh',
        'Japanese': 'ja',
        'Korean': 'ko',
        'Russian': 'ru'
    };

    const selector = document.getElementById('languageSelector');
    
    if (selector) {
        const sortedLanguages = Object.keys(langCodes).sort();
        
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Select Language';
        defaultOption.value = '';
        selector.appendChild(defaultOption);

        sortedLanguages.forEach(language => {
            const option = document.createElement('option');
            option.value = langCodes[language];
            option.textContent = language;
            selector.appendChild(option);
        });

        selector.value = 'en';
    }

    // Handle Voice Selection
    const voiceSelect = document.querySelector("select");
    if (voiceSelect) {
        voiceSelect.addEventListener("change", (event) => {
            const selectedVoice = event.target.value;
            console.log(`Voice changed to: ${selectedVoice}`);
        });
    }

    // Handle Speech Rate Change
    const speechRateSlider = document.querySelector("input[type='range']");
    if (speechRateSlider) {
        speechRateSlider.addEventListener("input", (event) => {
            const speechRate = event.target.value;
            console.log(`Speech rate adjusted to: ${speechRate}`);
        });
    }

    // Handle Gesture Calibration Button Click
    const calibrateButton = document.querySelector("button");
    if (calibrateButton) {
        calibrateButton.addEventListener("click", () => {
            console.log("Gesture calibration started.");
        });
    }

    const shortcutCommands = [
        {
            command: "start",
            action: () => {
                console.log("Speech-to-Text enabled.");
            },
        },
        {
            command: "stop",
            action: () => {
                console.log("Speech-to-Text disabled.");
            },
        },
    ];

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

    console.log("Dashboard initialized successfully");
});
});
