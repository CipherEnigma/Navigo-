class Feedback {
  static showFeedback(message, type = 'info') {
      let feedback = document.getElementById('navigator-feedback');
      if (!feedback) {
          feedback = document.createElement('div');
          feedback.id = 'navigator-feedback';
          document.body.appendChild(feedback);
      }
      
      feedback.textContent = message;
      feedback.className = `navigator-feedback ${type}`;
      setTimeout(() => feedback.remove(), 2000);
  }

  static showPopup(title, content, options = {}) {
      const popup = document.createElement('div');
      popup.className = 'navigator-popup';
      popup.innerHTML = `
          <div class="popup-header">
              <h3>${title}</h3>
              <button class="close-popup">×</button>
          </div>
          <div class="popup-content">${content}</div>
      `;

      const style = document.createElement('style');
      style.textContent = `
          .navigator-popup {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
              z-index: 10000;
              max-width: 500px;
              width: 90%;
              max-height: 80%;
              overflow: auto;
              padding: 15px;
          }
          .popup-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
          }
          .close-popup {
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
          }
      `;

      document.head.appendChild(style);
      document.body.appendChild(popup);

      const closeButton = popup.querySelector('.close-popup');
      closeButton.onclick = () => {
          document.body.removeChild(popup);
          document.head.removeChild(style);
      };

      return popup;
  }
}

export default Feedback;