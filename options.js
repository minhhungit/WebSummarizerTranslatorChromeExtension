document.getElementById('toggle-password-1').addEventListener('click', function() {
  var passwordInput = document.getElementById('api-key');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
  } else {
    passwordInput.type = 'password';
  }
});

document.getElementById('toggle-password-2').addEventListener('click', function() {
  var passwordInput = document.getElementById('openai-tts-api-key');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
  } else {
    passwordInput.type = 'password';
  }
});

document.getElementById('save-settings').addEventListener('click', () => {
  const apiUrl = document.getElementById('api-url').value;
  const apiKey = document.getElementById('api-key').value;
  const modelName = document.getElementById('model-name').value;
  const temperature = parseFloat(document.getElementById('temperature').value); // Convert to number
  const maxToken = parseInt(document.getElementById('max-token').value);

  const openAITTSApiKey = document.getElementById('openai-tts-api-key').value;
  const openAITTSModelName = document.getElementById('openai-tts-model-name').value;
  const openAITTSVoice = document.getElementById('openai-tts-voice').value;

  chrome.storage.sync.set({ 
    apiUrl: apiUrl, 
    apiKey: apiKey,
    modelName: modelName, 
    temperature: temperature,
    maxToken: maxToken,
    openAITTSApiKey: openAITTSApiKey,
    openAITTSModelName: openAITTSModelName,
    openAITTSVoice: openAITTSVoice,
  }, () => {
    alert('Settings saved successfully!');
    window.close(); 
  });
});

// Load saved settings on page load
chrome.storage.sync.get(['apiUrl', 'apiKey', 'modelName', 'temperature', 'maxToken', 'openAITTSApiKey', 'openAITTSModelName', 'openAITTSVoice'], (items) => {
  document.getElementById('api-url').value = items.apiUrl || '';
  document.getElementById('api-key').value = items.apiKey || '';
  document.getElementById('model-name').value = items.modelName || '';
  document.getElementById('temperature').value = items.temperature;
  document.getElementById('max-token').value = items.maxToken;

  document.getElementById('openai-tts-api-key').value = items.openAITTSApiKey || '';
  document.getElementById('openai-tts-model-name').value = items.openAITTSModelName || '';
  document.getElementById('openai-tts-voice').value = items.openAITTSVoice || '';
});

// document.getElementById('open-options').addEventListener('click', function() {
//   // Define the desired width and height of the popup window
//   const width = 800;
//   const height = 600;

//   // Calculate the position to center the popup window on the screen
//   const left = Math.round((screen.width - width) / 2);
//   const top = Math.round((screen.height - height) / 2);

//   // Create the popup window with the calculated position and dimensions
//   chrome.windows.create({
//     url: chrome.runtime.getURL('options.html'),
//     type: 'popup',
//     width: width,
//     height: height,
//     left: left,
//     top: top
//   });
// });
