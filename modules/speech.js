export default class SpeechController {

 
    constructor() {
      this.recognition = new webkitSpeechRecognition() || new SpeechRecognition();
      this.isListening = false;
      this.commandMode=false;
      this.lastCommand='';
      this.commandHistory=[];
      this.setupRecognition();
     
  }
  
     
    setupRecognition() {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
  
      this.recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.trim().toLowerCase();
        
    
    this.commandHistory.push({
      command, 
      timestamp: new Date() 
  
    });
        if (command.includes('hey navigo')) {
          this.handleWakeWord(command);
        } else if (this.isListening) {
          this.processCommand(command);
        }
      };
  
      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateToolbarStatus('Listening');
        this.speakFeedback('Navigo activated');
      };
  
      this.recognition.onend=()=>{
        if(this.isListening){
          this.recognition.start();
        }
      };
  
      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.restartRecognition();
      };
    }
  
    processCommand(command){
    }
    handleWakeWord(command){
      this.isListening= true;
      this.showFeedback('Listening to you commanand');
    }
  
    start(){
      try{
        this.recognition.start(); 
      }
      catch(error){
        console.log('Recognition start error:',error);
        this.restartRecognition();
      }
    }
  
    restartRecognition(){
      setTimeout(()=>{
        try{
          this.recognition.start();
        }
        catch(error){
          console.log('Recognition restart error:',error);
        }
      },1000);
    }
  
    updateToolbarStatus(status){ }
  
  }
  export default SpeechController;  
  