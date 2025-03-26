class UIController {
    constructor() {
        this.injectStyles();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .navigo-toolbar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #000; border-radius: 12px; padding: 20px; z-index: 10000; display: flex; gap: 12px; color: #fff; }
            .navigo-toolbar button { padding: 10px 20px; border: none; border-radius: 6px; background: #6a0dad; color: white; cursor: pointer; }
            .navigo-toolbar button.active { background: #28a745; }
        `;
        document.head.appendChild(style);
    }

    showToolbar(voiceController, gestureController) {
        if (document.getElementById('navigo-toolbar')) return;

        const toolbar = document.createElement('div');
        toolbar.id = 'navigo-toolbar';
        toolbar.className = 'navigo-toolbar';
        toolbar.innerHTML = `
            <button id="voice-btn">Voice</button>
            <button id="gesture-btn">Gestures</button>
            <button id="close-btn">Close</button>
        `;

        document.body.appendChild(toolbar);

        // Add event listeners
        document.getElementById('voice-btn').onclick = () => {
            const isActive = !voiceController.isActive;
            voiceController.toggle(isActive);
            this.updateButton('voice-btn', isActive);
        };

        document.getElementById('gesture-btn').onclick = () => {
            const isActive = !gestureController.isActive;
            gestureController.toggle(isActive);
            this.updateButton('gesture-btn', isActive);
        };

        document.getElementById('close-btn').onclick = () => {
            this.cleanup();
            voiceController.stop();
            gestureController.stop();
        };
    }

    updateButton(id, isActive) {
        const button = document.getElementById(id);
        if (button) {
            button.classList.toggle('active', isActive);
            button.textContent = isActive ? `Stop ${id.replace('-btn', '')}` : `Start ${id.replace('-btn', '')}`;
        }
    }

    showFeedback(message) {
        const existing = document.querySelector('.navigo-feedback');
        if (existing) existing.remove();

        const feedback = document.createElement('div');
        feedback.className = 'navigo-feedback';
        feedback.textContent = message;
        document.body.appendChild(feedback);

        setTimeout(() => feedback.remove(), 3000);
    }

    showPageSummary() {
        const text = document.body.innerText.slice(0, 200);
        this.showFeedback(`Summary: ${text}...`);
    }

    cleanup() {
        const toolbar = document.getElementById('navigo-toolbar');
        if (toolbar) toolbar.remove();
    }
}

window.NavigoUIController = UIController;
