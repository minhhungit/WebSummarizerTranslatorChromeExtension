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
    modal.style.display = 'flex'; 

    const maximizeButton = modal.shadowRoot.querySelector('.maximize-dialog-button');
    maximizeButton.click();

    modal.shadowRoot.querySelector('.chat-input').focus();

    // Keep the message channel open for the async response
    sendResponse({status: 'OK'}); 
  }

  // Listen for messages from the context menu
  if (request.type === 'summarize' || request.type === 'translate' || request.type === 'correct-english' || request.type === 'teach-me') {
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

      chrome.storage.local.get(['defaultMessages'], (items) => {
        const defaultMessages = items.defaultMessages;

        if (response.error) {
          //console.error(response.error); 
          if (defaultMessages.length > 0){
            defaultMessages.forEach((msg, idx)=>{
              addMessageIntoModal(request, msg.role, msg.content, true, false);
            })
          }

          addMessageIntoModal(request, 'assistant', response.error, false, true); 
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
          if (defaultMessages.length > 0){
            defaultMessages.forEach((msg, idx)=>{
              addMessageIntoModal(request, msg.role, msg.content, true, false);
            })
          }
          addMessageIntoModal(request, 'assistant', response.result, false, false); 
        }
      });
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
  mywindow.document.write(`<style>
    @media print
    {    
        .no-print, .no-print *
        {
            display: none !important;
        }
    }
    </style>`);
  mywindow.document.write('</head><body>');
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

function removeAllButMessageActions(selectedMessageElm) {
  let children = selectedMessageElm.children;

  for (let i = children.length - 1; i >= 0; i--) {
      if (!children[i].classList.contains('message-actions')) {
          selectedMessageElm.removeChild(children[i]);
      }
  }
}

function addMessageIntoModal(request, role, rawMessage, hideDefaultMessage, isError) {
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

  // Configure marked with the breaks option
  marked.setOptions({
      breaks: true // Enable GFM line breaks
  });

  const htmlContent = marked.parse(rawMessage);

  const newMessage = document.createElement('div');

  if (hideDefaultMessage){
    newMessage.classList.add("default-message");
    newMessage.classList.add("no-print");
  }
  newMessage.classList.add("chat-message");
  
  newMessage.classList.add(`${role}-message`);

  if (isError){
    newMessage.classList.add(`error-message`);
  }

  const msgBody = document.createElement('div');
  msgBody.classList.add('message-body');
  msgBody.innerHTML = htmlContent; 
  newMessage.appendChild(msgBody);

  const msgActions = document.createElement('div');
  msgActions.classList.add('message-actions');
  // msgActions.classList.add('no-print');
  
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

      if (messagesArray.length > 0){
        memoryMessages.splice(newestUserMessageIndex + 1, memoryMessages.length - (newestUserMessageIndex + 1));
      }

      // if (request.type === 'simple-chat'){
      //   // simple chat has no predefined prompt
      //   if (messagesArray.length > 0){
      //     memoryMessages.splice(newestUserMessageIndex + 1, memoryMessages.length - (newestUserMessageIndex + 1));
      //   }
      // }
      // else{
      //   // for features that already has pre-defined prompt 
      //   if (messagesArray.length > 0 && (newestUserMessageIndex + 2) >= 0){
      //     memoryMessages.splice(newestUserMessageIndex + 2 + 1, memoryMessages.length - (newestUserMessageIndex + 2 + 1));
      //   }
      // }      
      
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
          addMessageIntoModal(request, 'assistant', response.error, false, true); 
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
          addMessageIntoModal(request, 'assistant', response.result, false, false); 
        }
      });
    })
  });

  // const actionDeleteButton = document.createElement('button');
  // actionDeleteButton.classList.add("delete-button");
  // actionDeleteButton.textContent = "Delete";

  const actionEditButton = document.createElement('button');
  actionEditButton.classList.add("edit-button");
  actionEditButton.textContent = "Edit";
  actionEditButton.addEventListener('click', e=>{
    const chatMessagesContainer = modal.shadowRoot.querySelector('.chat-messages');
    const chatMessageElements = chatMessagesContainer.children;

    let selectedMessageElm = findAncestor(e.target, 'chat-message');
    let messageBodyElm = selectedMessageElm.querySelector('.message-body');
    let selectedIndex = Array.from(chatMessageElements).indexOf(selectedMessageElm);

    if (actionEditButton.innerText == "Edit"){
      
       // Create a new input textbox element
      let inputTextbox = document.createElement('textarea');
      inputTextbox.placeholder = "Type your message here...";
      inputTextbox.rows = 4;
      inputTextbox.style.width = '100%';
      inputTextbox.style.minHeight = '100px';
  
      inputTextbox.value = rawMessage.replace(/<br\s*\/?>/ig, '\n');

      messageBodyElm.innerHTML = "";

      // Append the input textbox to the chat-message element
      messageBodyElm.appendChild(inputTextbox);

      inputTextbox.focus();

      if (selectedMessageElm.classList.contains('assistant-message')){
        role = "assistant";
        actionEditButton.textContent = "Update";
      }
      else if (selectedMessageElm.classList.contains('user-message')){
        role = "user";
        actionEditButton.textContent = "Update";
      }      
    }
    else{
      marked.setOptions({
          breaks: true // Enable GFM line breaks
      });
  
      let textarea = messageBodyElm.querySelector('textarea');
      const newMessage = textarea.value;
      rawMessage = newMessage;
      const htmlContent = marked.parse(newMessage);
      
      actionEditButton.textContent = "Edit";

      //removeAllButMessageActions(selectedMessageElm);

      messageBodyElm.innerHTML = htmlContent;

      // Check if selectedIndex is within bounds
      if (selectedIndex >= 0 && selectedIndex < chatMessageElements.length) {
        // Remove all elements after selectedIndex
        for (let i = chatMessageElements.length - 1; i > selectedIndex; i--) {
            chatMessagesContainer.removeChild(chatMessageElements[i]);
        }
      } else {
          console.error('Invalid index to remove');
      }

      // trigger send button
      chrome.storage.local.get(['lastSelectedCommand', 'chatMessages'], (items) => {
        let lastSelectedCommand = items.lastSelectedCommand;
        let memoryMessages = items.chatMessages;

        let role = "user";
    
        if (selectedMessageElm.classList.contains('assistant-message')){
          role = "assistant";
        }
        else if (selectedMessageElm.classList.contains('user-message')){
          role = "user";
        }
    
        // Remove all elements after selectedIndex
        for (let i = memoryMessages.length - 1; i >= selectedIndex; i--) {
          memoryMessages.splice(i, 1);
        }
        
        memoryMessages.push({
          role: role,
          content: newMessage
        });
    
        // save new list messages into memory
        chrome.storage.local.set({
          chatMessages: memoryMessages
          }, () => {
        });

        // if (role == "assistant"){

        // }
        // else {
        //   showLoadingIndicator();
      
        //   if (request.type === 'simple-chat'){
        //     lastSelectedCommand = 'simple-chat';
        //   }

        //   chrome.runtime.sendMessage({ 
        //     type: lastSelectedCommand, 
        //     messages: memoryMessages
        //   }, (response) => {
      
        //     // Hide loading indicator when response is received
        //     hideLoadingIndicator(); 
      
        //     if (response.error) {
        //       // update message list
        //       chrome.storage.local.set({
        //           chatMessages: memoryMessages
        //         }, () => {
        //       });
      
        //       //console.error(response.error); 
        //       addMessageIntoModal(request, 'assistant', response.error, false, true); 
        //       // Handle error, maybe show an error message on the page
        //     } else {
        //       memoryMessages.push({
        //         role: "assistant",
        //         content: response.result
        //       });
      
        //       // update message list
        //       chrome.storage.local.set({
        //           chatMessages: memoryMessages
        //         }, () => {
        //       });
      
        //       //console.log(memoryMessages);
      
        //       //addMessageIntoModal(request, 'user', nextMessage, false); 
      
        //       // Display the result on the webpage 
        //       addMessageIntoModal(request, 'assistant', response.result, false, false); 
        //     }
        //   });
        // }
      });
    }

  });

  const actionCopyButton = document.createElement('button');
  actionCopyButton.classList.add("copy-button");
  actionCopyButton.textContent = "Copy";
  actionCopyButton.addEventListener('click', e=>{
    let selectedMessageElm = findAncestor(e.target, 'chat-message');
    let bodyMessageElm = selectedMessageElm.querySelector('.message-body');
    //let selectedIndex = messagesArray.indexOf(selectedMessageElm);

    copyTextToClipboard(bodyMessageElm.textContent);
  });

  msgActions.appendChild(actionEditButton);
  msgActions.appendChild(actionRetryButton);
  // msgActions.appendChild(actionDeleteButton);
  msgActions.appendChild(actionCopyButton);

  newMessage.appendChild(msgActions);

  modal.shadowRoot.querySelector('.chat-messages').appendChild(newMessage);

  // Show the modal
  modal.style.display = 'flex'; 

  const maximizeButton = modal.shadowRoot.querySelector('.maximize-dialog-button');
  maximizeButton.click();

  scrollToLastMessage();
  modal.shadowRoot.querySelector('.chat-input').focus();
}

function createModal(request) {
  const modal = document.createElement('div');
  modal.classList.add('my-extension-modal');

  // To prevent the dialog from closing when clicking inside it, stop propagation of the click event
  modal.addEventListener('click', function(event) {
    event.stopPropagation();
  });

  // Create a shadow root
  const shadow = modal.attachShadow({ mode: 'open' });

  // Add styles and content to the shadow root
  shadow.innerHTML = `
    <style>
    html {
      line-height: 1.15; /* 1 */
      -webkit-text-size-adjust: 100%; /* 2 */
    }

    body {
      margin: 0;
    }

    main {
      display: block;
    }


    h1 {
      font-size: 2em;
      margin: 0.67em 0;
    }


    hr {
      box-sizing: content-box; /* 1 */
      height: 0; /* 1 */
      overflow: visible; /* 2 */
    }

    pre {
      font-family: monospace, monospace; /* 1 */
      font-size: 1em; /* 2 */
    }

    a {
      background-color: transparent;
    }

    abbr[title] {
      border-bottom: none; /* 1 */
      text-decoration: underline; /* 2 */
      text-decoration: underline dotted; /* 2 */
    }

    b,
    strong {
      font-weight: bolder;
    }

    code,
    kbd,
    samp {
      font-family: monospace, monospace; /* 1 */
      font-size: 1em; /* 2 */
    }

    small {
      font-size: 80%;
    }

    sub,
    sup {
      font-size: 75%;
      line-height: 0;
      position: relative;
      vertical-align: baseline;
    }

    sub {
      bottom: -0.25em;
    }

    sup {
      top: -0.5em;
    }

    img {
      border-style: none;
    }

    button,
    input,
    optgroup,
    select,
    textarea {
      font-family: inherit; /* 1 */
      font-size: 100%; /* 1 */
      line-height: 1.15; /* 1 */
      margin: 0; /* 2 */
    }

    button,
    input { 
      overflow: visible;
    }

    button,
    select {
      text-transform: none;
    }


    button,
    [type="button"],
    [type="reset"],
    [type="submit"] {
      -webkit-appearance: button;
    }

    button::-moz-focus-inner,
    [type="button"]::-moz-focus-inner,
    [type="reset"]::-moz-focus-inner,
    [type="submit"]::-moz-focus-inner {
      border-style: none;
      padding: 0;
    }

    button:-moz-focusring,
    [type="button"]:-moz-focusring,
    [type="reset"]:-moz-focusring,
    [type="submit"]:-moz-focusring {
      outline: 1px dotted ButtonText;
    }

    fieldset {
      padding: 0.35em 0.75em 0.625em;
    }

    legend {
      box-sizing: border-box; /* 1 */
      color: inherit; /* 2 */
      display: table; /* 1 */
      max-width: 100%; /* 1 */
      padding: 0; /* 3 */
      white-space: normal; /* 1 */
    }

    progress {
      vertical-align: baseline;
    }

    textarea {
      overflow: auto;
    }

    [type="checkbox"],
    [type="radio"] {
      box-sizing: border-box; /* 1 */
      padding: 0; /* 2 */
    }


    [type="number"]::-webkit-inner-spin-button,
    [type="number"]::-webkit-outer-spin-button {
      height: auto;
    }


    [type="search"] {
      -webkit-appearance: textfield; /* 1 */
      outline-offset: -2px; /* 2 */
    }

    [type="search"]::-webkit-search-decoration {
      -webkit-appearance: none;
    }

    ::-webkit-file-upload-button {
      -webkit-appearance: button; /* 1 */
      font: inherit; /* 2 */
    }

    details {
      display: block;
    }

    summary {
      display: list-item;
    }

    template {
      display: none;
    }

    [hidden] {
      display: none;
    }

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
      left: 10%;
      top: 10%;
      width: 80%;
      z-index: 2147483646;
      font-size: 16px;
      transition: opacity 0.3s;
    }

    .modal-container.fade-in {
      animation: fadeIn 0.3s;
      left: 10%;
      top: 10%
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
      clear:both;
      font: 1.0625rem/1.5 Segoe UI,"Segoe UI Web Regular","Segoe UI Regular WestEuropean","Segoe UI",Tahoma,Arial,Roboto,"Helvetica Neue",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
      color: #333 !important;
      font-size: 16px;
      line-height: 28px;
    }

    .chat-message ul, .chat-message li{
      font: 1.0625rem/1.5 Segoe UI,"Segoe UI Web Regular","Segoe UI Regular WestEuropean","Segoe UI",Tahoma,Arial,Roboto,"Helvetica Neue",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
      font-size: 16px;
      line-height: 28px;
    }
  
    .chat-message.user-message {
      background-color: #f2f2f2;
      float:right;
      width: auto;
      margin-right:20px;
      max-width: 80%;
      clear: both;
    }
  
    .chat-message.assistant-message {
      background-color: #e0f2f1;
      text-align: left;
      float:left;
      width: 80%;
      clear: both;
    }

    .chat-message.error-message{
      border: solid 1px #ffa9a9;
      background: #ffeeee;
      clear: both;
    }

    .chat-message.default-message{
      display: none;
    }
  
    .chat-message p {
      margin: 0;
      font: 1.0625rem/1.5 Segoe UI,"Segoe UI Web Regular","Segoe UI Regular WestEuropean","Segoe UI",Tahoma,Arial,Roboto,"Helvetica Neue",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
      font-size: 16px;
      line-height: 28px;
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
      color: #333 !important;
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
      background: #fff !important;
      color: #333 !important;
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
    }
  
    .dialog-head .title {
      color: white;
      font-weight: bold;
      margin: 0;
    }
  
    .caption-bar-actions{
      display: flex;
      flex-direction: row;
      position: absolute;
      top: -10px;
      right: -20px;
    }

    .caption-bar-action-button{
      color: white;
      background-color: #007BFF;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: transform 0.3s, background-color 0.3s, box-shadow 0.3s;
      margin-right: 10px;
      height: 30px;
      min-width: 30px;
      line-height: 30px;
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
    @@media print
    {    
        .no-print, .no-print *
        {
            display: none !important;
        }
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
        <textarea class="chat-input" rows="4" placeholder="Type your message here..."></textarea>
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

  maximizeButton.addEventListener('click', (e) => {
    e.preventDefault();
    
    modalContainer.classList.remove('fade-out');
    modalContainer.classList.add('fade-in');
    modalContainer.style.display = 'flex';
    maximizeButton.classList.add('hide');
  });

  makeDraggable(shadow.querySelector('.maximize-dialog-button'), shadow.querySelector('.maximize-dialog-button'));

  minimizeButton.addEventListener('click', (e) => {
    e.preventDefault();

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
      let lastSelectedCommand = items.lastSelectedCommand;
      let memoryMessages = items.chatMessages;
  
      const chatInput = shadow.querySelector('.chat-input');
  
      let nextMessage = "";
      let role = "";
  
      nextMessage = chatInput.value.replace(/\n/g, '<br />');
      role = "user";
      if (!nextMessage){
        // allow submit with empty message
      }
      else{
        addMessageIntoModal(request, role, nextMessage, false, false);
            
        memoryMessages.push({
          role: role,
          content: nextMessage
        });
      }
  
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
          addMessageIntoModal(request, 'assistant', response.error, false, true); 
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
  
          //addMessageIntoModal(request, 'user', nextMessage, false); 
  
          // Display the result on the webpage 
          addMessageIntoModal(request, 'assistant', response.result, false, false); 
        }
      });
    });
  });

  shadow.querySelector('.chat-input').addEventListener('keydown', function (event) {
    event.stopPropagation();

    // Handle Enter key separately if needed
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent form submission or other default actions

        // Trigger the click event of the send button
        shadow.querySelector('.send-button').click();
    }
  }, true);

  // Make the modal draggable  
  makeDraggable(shadow.querySelector('.modal-container'), shadow.querySelector('.dialog-head'));

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

function makeDraggable(elmnt, headElmt) {
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

// Event listener for clicks on the document
document.addEventListener('click', function(event) {
  let modal = document.querySelector('.my-extension-modal');

  // Create modal if it doesn't exist
  if (modal) {
    // Check if the click happened outside the dialog
    if (!modal.contains(event.target)) {
      const minimizeButton = modal.shadowRoot.querySelector('.minimize-dialog-button');
      if (minimizeButton){
        minimizeButton.click();
      }
    }
  }
});

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