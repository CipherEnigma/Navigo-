class SpeechController {
    constructor() {
        console.log('Initializing SpeechController');
        this.recognition = null;
        this.isListening = false;
        this.commands = {
            'scroll down': () => window.scrollBy(0, 300),
            'scroll up': () => window.scrollBy(0, -300),
            'go back': () => window.history.back(),
            'go forward': () => window.history.forward(),
            'search for': (transcript) => this.handleSearch(transcript),
            'find': (transcript) => this.handleSearch(transcript),
            'search page': (transcript) => this.handleSearch(transcript)
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
                
                for (let i = 0; i < event.results[last].length; i++) {
                    const transcript = event.results[last][i].transcript.trim().toLowerCase();
                    const confidence = event.results[last][i].confidence;
                    
                    console.log(`🎤 Heard (${confidence.toFixed(2)}): "${transcript}"`);
                    
                    if (this.isWakeWord(transcript)) {
                        console.log('🎯 Wake word detected in alternative', i);
                        this.handleWakeWord();
                        return;
                    }
                }
            
                if (this.commandMode) {
                    const transcript = event.results[last][0].transcript.trim();
                    console.log('⚡ Processing command:', transcript);
                    
                    // Check for search commands
                    const searchCommands = ['search for', 'find', 'search page'];
                    const isSearchCommand = searchCommands.some(cmd => 
                        transcript.toLowerCase().startsWith(cmd)
                    );
            
                    if (isSearchCommand) {
                        this.commands['search for'](transcript);
                    } else {
                        this.processCommand(transcript);
                    }
                } else {
                    console.log('❌ Not in command mode. Say "Hey Navigo" first!');
                    this.showVisualFeedback('Say "Hey Navigo" to start');
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

    handleSearch(transcript) {
        console.log('Received transcript:', transcript);
        const searchCommands = ['search for', 'find', 'search page'];
        
        // More detailed logging
        const matchedCommand = searchCommands.find(cmd => transcript.toLowerCase().includes(cmd));
        
        console.log('Matched command:', matchedCommand);
        console.log('Search commands array:', searchCommands);
    
        if (matchedCommand) {
            const searchQuery = transcript.toLowerCase().replace(matchedCommand, '').trim();
            console.log('Extracted search query:', searchQuery);
    
            if (searchQuery) {
                this.performPageSearch(searchQuery, this.createSearchOverlay());
                return;
            }
        }
    
        console.warn('Failed to process search command:', transcript);
        this.showVisualFeedback('Unable to process search command');
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
        return overlay;
    }
    
    performPageSearch(query, overlay) {
        const text = document.body.innerText;
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
        const resultsContainer = overlay.querySelector('.search-results');
        resultCount.textContent = `${matches.length} matches found`;
    
        // Clear existing highlights
        document.querySelectorAll('.search-match').forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
        });
    
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
    
        function highlightCurrent() {
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
        }
    }
}

window.SpeechController = SpeechController;
