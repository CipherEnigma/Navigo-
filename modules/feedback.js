class Feedback {
    static showFeedback(message, type) {
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
  }
  
  export default Feedback;