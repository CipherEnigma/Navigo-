document.addEventListener("DOMContentLoaded", () => {

    const selector = document.getElementById('languageSelector');
       
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

    
    const backButton = document.querySelector("a[href='popup/popup.html']");
    backButton.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = backButton.getAttribute("href");
    });

   
    const voiceSelect = document.querySelector("select");
    voiceSelect.addEventListener("change", (event) => {
        const selectedVoice = event.target.value;
        console.log(`Voice changed to: ${selectedVoice}`);
        
    });

   
    const speechRateSlider = document.querySelector("input[type='range']");
    speechRateSlider.addEventListener("input", (event) => {
        const speechRate = event.target.value;
        console.log(`Speech rate adjusted to: ${speechRate}`);
       
    });

    
    const calibrateButton = document.querySelector("button");
    calibrateButton.addEventListener("click", () => {
        console.log("Gesture calibration started.");
        
    });

    
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

    
    console.log("Simulating voice commands: 'start', 'stop'.");
    simulateVoiceCommand("start");
    simulateVoiceCommand("stop");



});
