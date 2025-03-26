class Feedback {
    static showFeedback(message, type = 'info') {
        // Remove existing feedback
        const existing = document.querySelector('.navigo-feedback');
        if (existing) existing.remove();
        
        const feedback = document.createElement('div');
        feedback.className = `navigo-feedback ${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: ${this.getBackgroundColor(type)} !important;
            color: white !important;
            padding: 12px 20px !important;
            border-radius: 6px !important;
            z-index: 999999 !important;
            font-family: Arial, sans-serif !important;
            font-size: 14px !important;
            animation: slideIn 0.3s ease-out !important;
            max-width: 300px !important;
            word-wrap: break-word !important;
        `;
        
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
    }
    
    static getBackgroundColor(type) {
        const colors = {
            'info': 'rgba(33, 150, 243, 0.95)',
            'success': 'rgba(76, 175, 80, 0.95)',
            'error': 'rgba(244, 67, 54, 0.95)',
            'warning': 'rgba(255, 152, 0, 0.95)'
        };
        return colors[type] || colors.info;
    }
}

export default Feedback;