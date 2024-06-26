// Create a cache object to store audio URLs
const audioCache = {};

// Function to fetch audio
const fetchAudio = (openAITTSApiKey, openAITTSModelName, openAITTSVoice, text) => {
  // Check if audio URL for the given text is already cached
  if (audioCache[text]) {
      playAudio(audioCache[text]);
  } else {
      // Fetch audio from API
      fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openAITTSApiKey}`
          },
          body: JSON.stringify({
              "model": openAITTSModelName,
              "input": text,
              "voice": openAITTSVoice
          })
      })
      .then(response => {
          if (!response.ok) {
              throw new Error('Failed to fetch from API');
          }
          return response.blob(); // Assuming the API returns audio data as a Blob
      })
      .then(audioBlob => {
          // Convert audio Blob to URL
          const audioUrl = URL.createObjectURL(audioBlob);
          // Cache the audio URL
          audioCache[text] = audioUrl;
          // Play the audio
          playAudio(audioUrl);
      })
      .catch(error => {
          alert('Error:', error);
      });
  }
};

// Function to play audio
const playAudio = (audioUrl) => {
  // Create an <audio> element to play the audio
  const audioElement = new Audio(audioUrl);
  // Play the audio
  audioElement.play();
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // if (request.type === 'getSelectedText') {
  //   const selectedText = window.getSelection().toString();
  //   sendResponse({ selectedText: selectedText });
  // }

  if (request.type === 'pronounce'){
    chrome.storage.sync.get(['openAITTSApiKey', 'openAITTSModelName', 'openAITTSVoice'], (items) => {
      const openAITTSApiKey = items.openAITTSApiKey;
      const openAITTSModelName = items.openAITTSModelName;
      const openAITTSVoice = items.openAITTSVoice;

      try{
        window.speechSynthesis.cancel();

        let audioElement;
        if (audioElement != null && typeof audioElement != 'undefined'){
          audioElement.pause();
        }
      }catch{}

      if (!openAITTSApiKey || !openAITTSModelName || !openAITTSVoice || request.selectionText.length > 100){
        // Create a new SpeechSynthesisUtterance object
        var utterance = new SpeechSynthesisUtterance();

        // Set the text that you want to pronounce
        utterance.text = request.selectionText;

        // Use the speech synthesis API to speak the utterance
        window.speechSynthesis.speak(utterance);    
      }
      else{
        fetchAudio(openAITTSApiKey, openAITTSModelName, openAITTSVoice, request.selectionText.trim());
      }      
    });

    // Keep the message channel open for the async response
    sendResponse({status: 'OK'}); 
  }

  // Listen for messages from the context menu
  if (request.type === 'simple-chat') {
    let modal = document.querySelector('.my-extension-modal');

    // Create modal if it doesn't exist
    if (!modal) {
      modal = createModal(request);
      document.body.appendChild(modal);
    }

    if (request.isNewChat){

    }

    // Show the modal
    modal.style.display = 'block'; 

    const maximizeButton = modal.shadowRoot.querySelector('.maximize-dialog-button');
    maximizeButton.click();

    modal.shadowRoot.querySelector('.chat-input').focus();

    // Keep the message channel open for the async response
    sendResponse({status: 'OK'}); 
  }

  // Listen for messages from the context menu
  if (request.type === 'summarize' || request.type === 'translate' || request.type === 'correct-english') {
    //console.log('Message received in content.js:', request); 
    // Forward the message to background.js

    // Show loading indicator 
    showLoadingIndicator(); 

    chrome.runtime.sendMessage(request, (response) => {
      // Send the response back to the context menu handler 
      //sendResponse(response);
      
      // Hide loading indicator when response is received
      hideLoadingIndicator(); 

      // new session
      if(request.isNewChat){
        clearAllMessagesHtml();
      }

      if (response.error) {
        //console.error(response.error); 
        addMessageIntoModal(request, 'assistant', response.error, true); 
        // Handle error, maybe show an error message on the page
      } else {
        // Display the result on the webpage 
        const resultText = response.result;
        
        //console.log(resultText);

        // *** CHOOSE ONE OF THESE METHODS TO DISPLAY THE RESULT ***
  
        // Method 1: Alert (least desirable - use other methods if possible)
        // alert(resultText);  
  
        // Method 2: Create a new element
        // const resultDiv = document.createElement('div');
        // resultDiv.textContent = resultText;
        // document.body.appendChild(resultDiv); 
  
        // Method 3: Update an existing element (if you have a suitable one)
        // const displayElement = document.querySelector('.my-display-element');
        // if (displayElement) {
        //   displayElement.textContent = resultText;
        // }

        // Method 4: show modal
        addMessageIntoModal(request, 'assistant', response.result, false); 
      }
    });

    // Keep the message channel open for the async response
    sendResponse({status: 'OK'}); 
  }
});

function clearAllMessagesHtml(){
  let modal = document.querySelector('.my-extension-modal');
  if (!modal){
    return;
  }

  const container = modal.shadowRoot.querySelector('.chat-messages')
  container.innerHTML = '';
}

function scrollToLastMessage() {
 
  let modal = document.querySelector('.my-extension-modal');
  if (!modal){
    return;
  }

  const container = modal.shadowRoot.querySelector('.chat-messages')

  // Select all div elements with the class "chat-message"
  const chatMessages = container.querySelectorAll('.chat-message');

  // Scroll to the last chat message if any exist
  if (chatMessages.length > 0) {
    const lastChatMessage = chatMessages[chatMessages.length - 1];
    lastChatMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}

function printChat(elem)
{
  var mywindow = window.open('', 'PRINT', 'height=700,width=900');

  mywindow.document.write('<html><head><title></title>');
  mywindow.document.write('</head><body >');
  mywindow.document.write(elem.innerHTML);
  mywindow.document.write('</body></html>');

  mywindow.document.close(); // necessary for IE >= 10
  mywindow.focus(); // necessary for IE >= 10*/

  mywindow.print();
  mywindow.close();

  return true;
}

function findAncestor (el, cls) {
  while ((el = el.parentElement) && !el.classList.contains(cls));
  return el;
}

function findNearestSiblingIndexWithClassUp(array, index, className) {
  // Check if the provided index is within the valid range
  if (index < 0 || index >= array.length) {
    //console.error("Index out of range");
    return -1;
  }

  // Start iterating backward from the provided index
  for (let i = index - 1; i >= 0; i--) {
    if (array[i] !== undefined) {
      // Check if the sibling element contains the specified class name
      if (array[i].classList && array[i].classList.contains(className)) {
        return i;
      }
    }
  }

  // If no sibling with the specified class name is found, return null
  return -1;
}

function copyTextToClipboard(text) {
  navigator.clipboard.writeText(text)
      .then(() => {
          //console.log('Text copied to clipboard:', text);
      })
      .catch(err => {
          //console.error('Error copying text:', err);
      });
}

function addMessageIntoModal(request, role, rawMessage, isError) {
  let modal = document.querySelector('.my-extension-modal');

  // Create modal if it doesn't exist
  if (!modal) {
    modal = createModal(request);
    document.body.appendChild(modal);
  }

  // Convert Markdown to HTML
  //const converter = new showdown.Converter(); 
  // var converter = new showdown.Converter({extensions: ['table', 'youtube', 'prettify']});
  // const htmlContent = converter.makeHtml(rawMessage);

  const htmlContent = marked.parse(rawMessage);

  const newMessage = document.createElement('div');
  newMessage.classList.add("chat-message");
  newMessage.classList.add(`${role}-message`);

  if (isError){
    newMessage.classList.add(`error-message`);
  }

  newMessage.innerHTML = htmlContent; 

  const msgActions = document.createElement('div');
  msgActions.classList.add('message-actions');
  
  // // Attach mousemove event listener
  // newMessage.addEventListener('mousemove', function(event) {
  //   // Calculate mouse position relative to newMessage
  //   const mouseX = event.clientX;
  //   const mouseY = event.clientY;
  //   const rect = newMessage.getBoundingClientRect();
  //   const offsetX = mouseX - rect.left;
  //   const offsetY = mouseY - rect.top;

  //   // Calculate the maximum allowable position for the action div
  //   const maxLeft = rect.width - msgActions.offsetWidth;
  //   const maxTop = rect.height - msgActions.offsetHeight;

  //   // Calculate the adjusted position for the action div
  //   let adjustedLeft = offsetX + 20;
  //   let adjustedTop = offsetY + 20;

  //   // Ensure the action div stays inside the newMessage
  //   adjustedLeft = Math.min(adjustedLeft, maxLeft);
  //   adjustedTop = Math.min(adjustedTop, maxTop);

  //   // Position message-actions
  //   msgActions.style.left = adjustedLeft + 'px';
  //   msgActions.style.top = adjustedTop + 'px';

  //   // Show message-actions
  //   msgActions.style.display = 'block';
  // });

  // // Hide message-actions when mouse moves out
  // newMessage.addEventListener('mouseout', function(event) {
  //   msgActions.style.display = 'none';
  // });

  // const actionEditButton = document.createElement('button');
  // actionEditButton.classList.add("edit-button");
  // actionEditButton.textContent = "Edit";

  const actionRetryButton = document.createElement('button');
  actionRetryButton.classList.add("retry-button");
  actionRetryButton.textContent = "Retry";
  actionRetryButton.addEventListener('click', (e) => {

    const messagesArray = Array.from(modal.shadowRoot.querySelector('.chat-messages').children);
    
    let selectedMessageElm = findAncestor(e.target, 'chat-message');
    let selectedIndex = messagesArray.indexOf(selectedMessageElm);

    let newestUserMessageIndex = selectedIndex;
    if (selectedMessageElm.classList.contains('assistant-message')){
      if (selectedIndex == 0)
      {
        newestUserMessageIndex = newestUserMessageIndex - 1;
      }
      else{
        newestUserMessageIndex = findNearestSiblingIndexWithClassUp(modal.shadowRoot.querySelector('.chat-messages').children, selectedIndex, 'user-message');
      }      
    }
    
    if (newestUserMessageIndex >= 0){
      if (messagesArray.length > 0){
        for(var i = modal.shadowRoot.querySelector('.chat-messages').children.length - 1; i >= 0 ; i--){
          if (i >= (newestUserMessageIndex + 1)){
            modal.shadowRoot.querySelector('.chat-messages').children[i].remove();
          }
          else{
            break;
          }
        }
      }
    }

    chrome.storage.local.get(['lastSelectedCommand', 'chatMessages'], (items) => {
      const memoryMessages = items.chatMessages;
      const lastSelectedCommand = items.lastSelectedCommand;

      if (request.type === 'simple-chat'){
        // simple chat has no predefined prompt
        if (messagesArray.length > 0){
          memoryMessages.splice(newestUserMessageIndex + 1, memoryMessages.length - (newestUserMessageIndex + 1));
        }
      }
      else{
        // for features that already has pre-defined prompt 
        if (messagesArray.length > 0 && (newestUserMessageIndex + 2) >= 0){
          memoryMessages.splice(newestUserMessageIndex + 2 + 1, memoryMessages.length - (newestUserMessageIndex + 2 + 1));
        }
      }      
      
      showLoadingIndicator(); 

      chrome.runtime.sendMessage({ 
        type: lastSelectedCommand, 
        messages: memoryMessages
      }, (response) => {         
        // Hide loading indicator when response is received
        hideLoadingIndicator(); 

        if (newestUserMessageIndex < 0){
          selectedMessageElm.remove();
        }

        if (response.error) {
          // update message list
          chrome.storage.local.set({
              chatMessages: memoryMessages
            }, () => {
          });

          //console.error(response.error); 
          addMessageIntoModal(request, 'assistant', response.error, true); 
          // Handle error, maybe show an error message on the page
        } else {
          // remove last assistant response and replace new one
          
          memoryMessages.push({
            role: "assistant",
            content: response.result
          });

          //console.log(memoryMessages);

          // update message list
          chrome.storage.local.set({
              chatMessages: memoryMessages
            }, () => {
          });

          // Display the result on the webpage        
          addMessageIntoModal(request, 'assistant', response.result, false); 
        }
      });
    })
  });

  // const actionDeleteButton = document.createElement('button');
  // actionDeleteButton.classList.add("delete-button");
  // actionDeleteButton.textContent = "Delete";

  const actionCopyButton = document.createElement('button');
  actionCopyButton.classList.add("copy-button");
  actionCopyButton.textContent = "Copy";
  actionCopyButton.addEventListener('click', e=>{
    let selectedMessageElm = findAncestor(e.target, 'chat-message');
    //let selectedIndex = messagesArray.indexOf(selectedMessageElm);

    copyTextToClipboard(selectedMessageElm.textContent);
  });

  // msgActions.appendChild(actionEditButton);
  msgActions.appendChild(actionRetryButton);
  // msgActions.appendChild(actionDeleteButton);
  msgActions.appendChild(actionCopyButton);

  newMessage.appendChild(msgActions);

  modal.shadowRoot.querySelector('.chat-messages').appendChild(newMessage);

  // Show the modal
  modal.style.display = 'block'; 

  const maximizeButton = modal.shadowRoot.querySelector('.maximize-dialog-button');
  maximizeButton.click();

  scrollToLastMessage();
  modal.shadowRoot.querySelector('.chat-input').focus();
}

function createModal(request) {
  const modal = document.createElement('div');
  modal.classList.add('my-extension-modal');

  // Create a shadow root
  const shadow = modal.attachShadow({ mode: 'open' });

  // Add styles and content to the shadow root
  shadow.innerHTML = `
    <style>
    body {
      font-family: 'Roboto', sans-serif;
      font-size: 15px;
    }

    table {
      border-collapse: collapse;
      padding: 4px;
      width: 100%;
      table-layout: fixed;
    }
    table td, table th {
      border: 1px solid orange;
      padding: 4px;
    }
    
    table td p, table th p {
      padding: 0;
      margin: 0;
    }
    
    pre{
      padding: 10px;
    }
    
    pre, code{
      background: #fff;
      overflow-x: scroll;
      color: #3f3f3f;
    }
  
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;        
      }
    }
    
    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    .modal-container {
      display: flex;
      flex-direction: column;
      background-color: #fff;
      border-radius: 10px;
      box-shadow: 0 0 20px rgb(107 107 107);
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 65%;
      z-index: 2147483646;
      font-size: 16px;
      transition: opacity 0.3s ease;
    }

    .modal-container.fade-in {
      display: block;
      animation: fadeIn 0.3s;
      left: 50%;
      top: 50%
    }
    
    .modal-container.fade-out {
      animation: fadeOut 0.3s;
    }
    
    .maximize-dialog-button {
      position: fixed;
      bottom: 60px;
      right: 100px;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      z-index: 1000;
      opacity: 1;
      width: 90px;
      height: 90px;
      box-shadow: 0 0 20px rgb(107 107 107);
      transition: transform .2s;
    }

    .maximize-dialog-button.hide {
      opacity: 0;
    }

    .maximize-dialog-button:hover {
      background-color: #3e9bff;
      transform: scale(1.1);
    }
  
    .chat-messages {
      overflow-y: scroll;
      min-height: 500px;
      margin: 20px;
      max-height: 60vh;
      padding-bottom: 50px;
    }

    .chat-messages::-webkit-scrollbar {
      width: 10px;
    }
    
    .chat-messages::-webkit-scrollbar-track {
      border-radius: 8px;
      background-color: #f1f1f1;
      border: 1px solid #dfdfdf;
    }
    
    .chat-messages::-webkit-scrollbar-thumb {
      border-radius: 8px;
      background-color: #c5c5c5;
    }
  
    .chat-message {
      padding: 20px;
      border-radius: 8px;
      position: relative;
      word-break: break-word;
      width: 100%;
      margin-bottom: 10px;
      clear:both
    }
  
    .chat-message.user-message {
      background-color: #f2f2f2;
      text-align: right;
      float:right;
      width: auto;
      margin-right:20px;
    }
  
    .chat-message.assistant-message {
      background-color: #e0f2f1;
      text-align: left;
      float:left;
      width: 80%;
    }

    .chat-message.error-message{
      border: solid 1px #ffa9a9;
      background: #ffeeee;
    }
  
    .chat-message p {
      margin: 0;
    }
  
    .chat-message code {
      background-color: #fff;
      border-radius: 3px;
      font-family: monospace;
      font-size: 14px;
    }
  
    .message-actions {
      position: absolute;
      
      display: none;
      background-color: #ffbef8;
      padding: 5px;
      border-radius: 5px;
      box-shadow: 0 0 15px rgb(95 95 95 / 48%);
      width: auto;
      min-width: 90px;
      bottom: -20px;
      right: 20px;
      z-index: 1;
    }
  
    .chat-message:hover .message-actions{
      display: block;
    }
    .message-actions button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 5px;
    }

    .message-actions button:hover{
      color: #7773a3
    }
  
    .chat-input-container {
      display: flex;
      gap: 10px;
      padding: 20px;
    }
  
    .chat-input {
      flex-grow: 1;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      resize: vertical;
      height: 50px;
      font-size: 16px;
    }
  
    .send-button {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
  
    .dialog-head {
      background-color: #007bff;
      padding: 10px;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      position: relative;
      cursor: move;
    }
  
    .dialog-head .title {
      color: white;
      font-weight: bold;
      margin: 0;
    }
  
    .caption-bar-actions{
      display: flex;
      flex-direction: row;
      position: fixed;
      top: -10px;
      right: -20px;
    }

    .caption-bar-action-button{
      color: white;
      background-color: #007BFF;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
      margin-right: 10px;
      height: 30px;
      min-width: 30px;
    }

    .caption-bar-action-button:hover{
      background-color: #58a8ff;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    .caption-bar-action-button.close-dialog-button:hover{
      background-color: #ff5858;
    }

    .minimize-dialog-button {
      background-color: #28a745;
      color: white;
    }

    .print-chat-button{
      background-color: #28a745;
      color: white;
    }

    .close-dialog-button {
      background-color: #eb4252;
      color: white;
    }
    
    </style>
    <div class="modal-container">
      <div class="dialog-head">
        <h3 class="title">AI Chatbot</h3>
        <div class="caption-bar-actions">
          <button class="caption-bar-action-button print-chat-button" title="Print">🖶 Print</button>
          <button class="caption-bar-action-button minimize-dialog-button" title="Minimize">⇘</button>
          <button class="caption-bar-action-button close-dialog-button" title="Close">⤫</button>
        </div>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input-container">
        <textarea class="chat-input" placeholder="Type your message here..."></textarea>
        <button class="send-button">Send</button>
      </div>
    </div>
    <button class="maximize-dialog-button hide">AI Chatbot</button>
  `;

  // Function to load html2canvas script

  function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      const scriptElement = document.createElement('script');
      scriptElement.src = chrome.runtime.getURL('js/html2canvas.min.js');
      scriptElement.onload = ()=>{
        // After html2canvas is loaded, you can execute your script
        const xElement = document.createElement('script');
        xElement.src = chrome.runtime.getURL('js/your-script.js');
        xElement.onload = resolve;
        xElement.onerror = reject;
        shadow.appendChild(xElement);
      };
      scriptElement.onerror = reject;
      shadow.appendChild(scriptElement);
    });
  }
  
  shadow.querySelector('.close-dialog-button').addEventListener('click', () => {
    
    let modal = document.querySelector('.my-extension-modal');
    if (!modal){
      return;
    }

    modal.style.display = 'none';

    const container = modal.shadowRoot.querySelector('.chat-messages')
    container.innerHTML = '';

    chrome.storage.local.set({ 
      lastSelectedCommand: undefined,
      chatMessages: []
      }, () => {
    });
    
  });

  const maximizeButton = shadow.querySelector('.maximize-dialog-button');
  const minimizeButton = shadow.querySelector('.minimize-dialog-button');
  const modalContainer = shadow.querySelector('.modal-container');

  maximizeButton.addEventListener('click', () => {
    modalContainer.classList.remove('fade-out');
    modalContainer.classList.add('fade-in');
    modalContainer.style.display = 'block';
    maximizeButton.classList.add('hide');
  });

  minimizeButton.addEventListener('click', () => {
    modalContainer.classList.remove('fade-in');
    modalContainer.classList.add('fade-out');
      setTimeout(() => {
        modalContainer.style.display = 'none';
      }, 300); // Match the duration of the transition
      maximizeButton.classList.remove('hide');
  });
  
  shadow.querySelector('.print-chat-button').addEventListener('click', () => {
    printChat(shadow.querySelector('.chat-messages'));

    //loadHtml2Canvas();
  });

  shadow.querySelector('.send-button').addEventListener('click', () => {
    chrome.storage.local.get(['lastSelectedCommand', 'chatMessages'], (items) => {
      const chatMsgText = shadow.querySelector('.chat-input').value;
      if (!chatMsgText){
        return;
      }

      let lastSelectedCommand = items.lastSelectedCommand;
      let memoryMessages = items.chatMessages;

      memoryMessages.push({
        role: "user",
        content: chatMsgText
      });

      addMessageIntoModal(request, 'user', chatMsgText, false);

      // clear chat box
      shadow.querySelector('.chat-input').value = '';

      showLoadingIndicator();

      if (request.type === 'simple-chat'){
        lastSelectedCommand = 'simple-chat';
      }

      chrome.runtime.sendMessage({ 
        type: lastSelectedCommand, 
        messages: memoryMessages
      }, (response) => {

        // Hide loading indicator when response is received
        hideLoadingIndicator(); 

        if (response.error) {
          // update message list
          chrome.storage.local.set({
              chatMessages: memoryMessages
            }, () => {
          });

          //console.error(response.error); 
          addMessageIntoModal(request, 'assistant', response.error, true); 
          // Handle error, maybe show an error message on the page
        } else {
          memoryMessages.push({
            role: "assistant",
            content: response.result
          });

          // update message list
          chrome.storage.local.set({
              chatMessages: memoryMessages
            }, () => {
          });

          //console.log(memoryMessages);

          //addMessageIntoModal(request, 'user', chatMsgText, false); 

          // Display the result on the webpage 
          addMessageIntoModal(request, 'assistant', response.result, false); 
        }
      });
    });   
  });

  shadow.querySelector('.chat-input').addEventListener('keydown', function (event) {
    event.stopPropagation();

    // Handle Enter key separately if needed
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission or other default actions
        
        // Trigger the click event of the send button
        shadow.querySelector('.send-button').click();
    }
  }, true);

  // Make the modal draggable  
  makeModalDraggable(shadow.querySelector('.modal-container'), shadow.querySelector('.dialog-head'));

  return modal;
}

// function makeModalDraggable(modal) {
//   let isDragging = false;
//   let offsetX, offsetY;

//   modal.addEventListener('mousedown', (e) => {
//     if (e.target === modal) { 
//       isDragging = true;
//       offsetX = e.clientX - modal.offsetLeft;
//       offsetY = e.clientY - modal.offsetTop;
//     }
//   });

//   document.addEventListener('mousemove', (e) => {
//     if (isDragging) {
//       modal.style.left = (e.clientX - offsetX) + 'px';
//       modal.style.top = (e.clientY - offsetY) + 'px';
//     }
//   });

//   document.addEventListener('mouseup', () => {
//     isDragging = false;
//   });
// }

function makeModalDraggable(elmnt, headElmt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (headElmt) {
    // if present, the header is where you move the DIV from:
    headElmt.onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
// Function to show a loading indicator
function showLoadingIndicator() {
  try{
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('my-extension-loading');
    loadingDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2147483647; /* Ensure it's on top of the modal */
      display: flex;
      align-items: center; /* Center vertically */
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      border: 4px solid #f3f3f3; 
      border-top: 4px solid #3498db; 
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
      margin-right: 10px;
    `;
    loadingDiv.appendChild(spinner);

    const loadingText = document.createElement('span');
    loadingText.textContent = `AI's thinking...`;
    loadingDiv.appendChild(loadingText);

    document.body.appendChild(loadingDiv);
  }catch{}
}

// Function to hide the loading indicator
function hideLoadingIndicator() {
  try{
    const loadingDiv = document.querySelector('.my-extension-loading');
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }catch{}
}

// youtube

// // --- Replace with your actual API endpoint ---
// const API_ENDPOINT = 'https://api.example.com/translate'; 
// // --------------------------------------------

// let preloadedSubtitles = [];
// let isLoadingSubtitles = false;
// const BATCH_SIZE = 10; // Adjust based on your API's limits

// async function translateText(text, targetLang = 'es') { 

//   return text.toUpperCase();

//   // try {
//   //   const response = await fetch(`${API_ENDPOINT}?text=${encodeURIComponent(text)}&targetLang=${targetLang}`);
//   //   if (!response.ok) {
//   //     throw new Error(`API request failed with status ${response.status}`);
//   //   }
//   //   const data = await response.json();
//   //   return data.translatedText || text; // Use translated or fall back to original
//   // } catch (error) {
//   //   console.error("Translation API error:", error);
//   //   return text; // Fallback on error
//   // }
// }

// async function batchTranslate(texts, targetLang) {
//   const translatedBatches = await Promise.all(
//     texts.reduce((batches, text, i) => {
//       const batchIndex = Math.floor(i / BATCH_SIZE);
//       if (!batches[batchIndex]) {
//         batches[batchIndex] = [];
//       }
//       batches[batchIndex].push(text);
//       return batches;
//     }, []).map(batch => translateText(batch.join('\n'), targetLang)) 
//   );
//   return translatedBatches.join('\n').split('\n'); // Split back into individual translations
// }


// async function preloadAndModifySubtitles(subtitleElements) {
//   isLoadingSubtitles = true;

//   const originalTexts = Array.from(subtitleElements).map(el => el.textContent);
//   preloadedSubtitles = preloadedSubtitles.concat(await batchTranslate(originalTexts)); 

//   isLoadingSubtitles = false;
//   updateSubtitles();
// }

// function updateSubtitles() {
//   const subtitleElements = document.querySelectorAll('.ytp-caption-segment');
//   subtitleElements.forEach((subtitleElement, index) => {
//     if (preloadedSubtitles[index]) {
//       subtitleElement.textContent = preloadedSubtitles[index];
//     }
//   });
// }

// // MutationObserver (same as before)
// const observer = new MutationObserver(mutations => {
//   mutations.forEach(mutation => {
//     if (mutation.type === 'childList' && mutation.addedNodes.length && !isLoadingSubtitles) {
//       const newSubtitleElements = Array.from(document.querySelectorAll('.ytp-caption-segment')).filter(el => !preloadedSubtitles.includes(el.textContent));
//       if (newSubtitleElements.length) {
//         preloadAndModifySubtitles(newSubtitleElements);
//       }
//     }
//   });
// });

// const subtitleContainer = document.querySelector('.ytp-caption-window-container');
// observer.observe(subtitleContainer, { childList: true, subtree: true });


// inject subtitle
function addStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    .subtitle-overlay {
      position: absolute;
      bottom: 10%;
      width: 100%;
      text-align: center;
      color: white;
      font-size: 24px;
      text-shadow: 2px 2px 4px black;
      z-index: 1000;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 10px;
      box-sizing: border-box;
      pointer-events: none;
    }
    video {
      position: relative;
    }
  `;
  document.head.appendChild(style);
}

function addSubtitleOverlay() {

  addStyles();
  
  const overlay = document.createElement('div');
  overlay.classList.add('subtitle-overlay');
  overlay.style.position = 'absolute';
  overlay.style.bottom = '50px';
  overlay.style.width = '100%';
  overlay.style.textAlign = 'center';
  overlay.style.color = 'white';
  overlay.style.fontSize = '24px';
  overlay.style.textShadow = '2px 2px 4px black';
  overlay.style.zIndex = '1000';
  document.body.appendChild(overlay);

  // let subtitles;
  // chrome.storage.local.get('subtitles', (result) => {
  //   subtitles = result.subtitles;
  //   if (subtitles) {
  //     const subtitleLines = parseSRT(subtitles);
  //     displaySubtitles(subtitleLines);
  //   }
  // });


  let sampleSrt = `1
  00:00:00,080 --> 00:00:01,719
  ở trong cái video này chúng ta sẽ cùng
  
  2
  00:00:01,719 --> 00:00:03,360
  nhau phân tích đối với lại những cái
  
  3
  00:00:03,360 --> 00:00:05,560
  dòng laptop mà cobal Plus Tức là nó chạy
  
  4
  00:00:05,560 --> 00:00:07,680
  những cái chip Snapdragon x elite mới á
  
  5
  00:00:07,680 --> 00:00:10,160
  hoặc là x Plus ha Thì nó sẽ có những cái
  
  6
  00:00:10,160 --> 00:00:12,320
  ưu điểm những cái lợi thế gì và những
  
  7
  00:00:12,320 --> 00:00:14,599
  cái thách thức mà qualcom sẽ phải đối
  
  8
  00:00:14,599 --> 00:00:16,480
  mặt khi mà họ ra mắt những cái con máy
  
  9
  00:00:16,480 --> 00:00:18,840
  này Cùng với lại Microsoft thì tại vì á
  
  `;

  let subtitleLines = parseSRTFromText(sampleSrt);
  console.log(subtitleLines);
  displaySubtitles(subtitleLines);
}

function parseSRT(srt) {
  return parseSRTFromText(srt);
}

function parseSRTFromText(srtText) {
  const lines = srtText.split('\n');
  const subtitleLines = [];
  let currentLine = {};
  
  lines.forEach(line => {
    if (/^\d+$/.test(line.trim())) {
      if (currentLine.startTime !== undefined) {
        subtitleLines.push(currentLine);
        currentLine = {};
      }
    } else if (line.includes(' --> ')) {
      const times = line.split(' --> ');
      currentLine.startTime = parseTime(times[0]);
      currentLine.endTime = parseTime(times[1]);
    } else if (line.trim() !== '') {
      currentLine.text = (currentLine.text || '') + line + '\n';
    }
  });

  if (currentLine.startTime !== undefined) {
    subtitleLines.push(currentLine);
  }

  return subtitleLines;
}

function parseTime(timeStr) {
  const parts = timeStr.split(':');
  const secondsParts = parts[2].split(',');
  return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(secondsParts[0], 10) + parseInt(secondsParts[1], 10) / 1000;
}

function displaySubtitles(subtitleLines) {
  const video = document.querySelector('video');
  const overlay = document.querySelector('.subtitle-overlay');
  let currentSubtitleIndex = 0;

  if (video) {
    video.addEventListener('timeupdate', () => {
      const currentTime = video.currentTime;

      while (currentSubtitleIndex < subtitleLines.length && currentTime > subtitleLines[currentSubtitleIndex].endTime) {
        currentSubtitleIndex++;
      }

      if (currentSubtitleIndex < subtitleLines.length && currentTime >= subtitleLines[currentSubtitleIndex].startTime && currentTime <= subtitleLines[currentSubtitleIndex].endTime) {
        overlay.innerText = subtitleLines[currentSubtitleIndex].text.trim();
      } else {
        overlay.innerText = '';
      }
    });
  }
}

// addSubtitleOverlay();