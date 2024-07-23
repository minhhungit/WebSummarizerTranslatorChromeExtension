document.getElementById('groq-api-key-toggle-password').addEventListener('click', function() {
  var passwordInput = document.getElementById('groq-api-key');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
  } else {
    passwordInput.type = 'password';
  }
});

document.getElementById('openai-api-key-toggle-password').addEventListener('click', function() {
  var passwordInput = document.getElementById('openai-api-key');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
  } else {
    passwordInput.type = 'password';
  }
});

document.getElementById('openai-whisper-toggle-password').addEventListener('click', function() {
  var passwordInput = document.getElementById('openai-tts-api-key');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
  } else {
    passwordInput.type = 'password';
  }
});

document.getElementById('save-settings').addEventListener('click', () => {
  const completionProvider =  document.getElementById('completion-provider').value;

  const groqApiUrl = document.getElementById('groq-api-url').value;
  const groqApiKey = document.getElementById('groq-api-key').value;
  const groqModelName = document.getElementById('groq-model-name').value;
  const groqTemperature = parseFloat(document.getElementById('groq-temperature').value); // Convert to number
  const groqMaxToken = parseInt(document.getElementById('groq-max-token').value);

  const openAiApiUrl = document.getElementById('openai-api-url').value;
  const openAiApiKey = document.getElementById('openai-api-key').value;
  const openAiModelName = document.getElementById('openai-model-name').value;
  const openAiTemperature = parseFloat(document.getElementById('openai-temperature').value); // Convert to number
  const openAiMaxToken = parseInt(document.getElementById('openai-max-token').value);

  const openAITTSApiKey = document.getElementById('openai-tts-api-key').value;
  const openAITTSModelName = document.getElementById('openai-tts-model-name').value;
  const openAITTSVoice = document.getElementById('openai-tts-voice').value;

  chrome.storage.sync.set({
    completionProvider: completionProvider,

    groqApiUrl: groqApiUrl, 
    groqApiKey: groqApiKey,
    groqModelName: groqModelName, 
    groqTemperature: groqTemperature,
    groqMaxToken: groqMaxToken,

    openAiApiUrl: openAiApiUrl, 
    openAiApiKey: openAiApiKey,
    openAiModelName: openAiModelName, 
    openAiTemperature: openAiTemperature,
    openAiMaxToken: openAiMaxToken,

    openAITTSApiKey: openAITTSApiKey,
    openAITTSModelName: openAITTSModelName,
    openAITTSVoice: openAITTSVoice,
  }, () => {
    alert('Settings saved successfully!');
    window.close(); 
  });
});

// Load saved settings on page load
chrome.storage.sync.get([
  'completionProvider',
  'groqApiUrl', 'groqApiKey', 'groqModelName', 'groqTemperature', 'groqMaxToken', 
  'openAiApiUrl', 'openAiApiKey', 'openAiModelName', 'openAiTemperature', 'openAiMaxToken', 
  'openAITTSApiKey', 'openAITTSModelName', 'openAITTSVoice'
], (items) => {
  document.getElementById('completion-provider').value = items.completionProvider || 'groq';

  document.getElementById('groq-api-url').value = items.groqApiUrl || '';
  document.getElementById('groq-api-key').value = items.groqApiKey || '';
  document.getElementById('groq-model-name').value = items.groqModelName || '';
  document.getElementById('groq-temperature').value = items.groqTemperature;
  document.getElementById('groq-max-token').value = items.groqMaxToken;

  document.getElementById('openai-api-url').value = items.openAiApiUrl || '';
  document.getElementById('openai-api-key').value = items.openAiApiKey || '';
  document.getElementById('openai-model-name').value = items.openAiModelName || '';
  document.getElementById('openai-temperature').value = items.openAiTemperature;
  document.getElementById('openai-max-token').value = items.openAiMaxToken;

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
