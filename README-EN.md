# Web Summarizer & Translator Chrome Extension

This Chrome Extension provides users with powerful AI-powered features to summarize, translate, correct English, and pronounce text directly from any webpage. 

https://github.com/minhhungit/WebSummarizerTranslatorChromeExtension/assets/2279508/6a29069d-7bc0-458e-a76c-c969b3c8ef53

## Features

- **Summarize Text:** Quickly get a concise and comprehensive summary of any selected text. 
- **Translate Text:** Effortlessly translate selected text into another language.
- **Correct English:** Identify and correct grammatical errors in English text.
- **Pronounce Text:** Hear the pronunciation of selected text with voice synthesis.

## Installation

1. **Download the extension:** Download the `.zip` file from this repository [Release] (https://github.com/minhhungit/WebSummarizerTranslatorChromeExtension/releases)
2. **Go to Chrome Extensions:** Open Chrome and type `chrome://extensions/` in the address bar.
3. **Enable Developer Mode:** Toggle the "Developer mode" switch on.
4. **Load Unpacked:** Click "Load unpacked" and select the folder where you extracted the `.zip` file.

## Usage

1. **Select Text:** Highlight the text you want to summarize, translate, correct, or pronounce.
2. **Right-click:** Right-click on the selected text and choose the desired action from the context menu.

## Options

You can customize the extension's settings by accessing the Options page:

1. **Open Chrome Extensions:** Go to `chrome://extensions/`.
2. **Click on the extension's icon:** Find the extension icon and click on it.
3. **Choose "Options":** Click on the "Options" link in the extension's popup.

On the Options page, you can set:

- **API URL:** The API endpoint for the chosen AI service. 
  - For **OpenAI**, the URL is typically: `https://api.openai.com/v1/chat/completions`.
  - Groq: https://api.groq.com/openai/v1/chat/completions

- **API Key:** Your API key for the AI service.
    - **Get your OpenAI API Key:** [https://platform.openai.com/settings/profile?tab=api-keys](https://platform.openai.com/settings/profile?tab=api-keys)
    - **Get your Groq API Key:** [https://console.groq.com/keys](https://console.groq.com/keys)
- **Model Name:** The specific AI model you want to use.
- **Temperature:** Adjust the creativity and randomness of the AI's output.
- **Max Token:** Limit the length of the AI's response.
- **Open AI Whisper- API Key:** Your API key for the OpenAI Whisper text-to-speech service (for Pronounce feature).
    - **Get your OpenAI Whisper API Key:** [https://platform.openai.com/settings/profile?tab=api-keys](https://platform.openai.com/settings/profile?tab=api-keys) 
- **Open AI Whisper- Model Name:** The specific Whisper model for text-to-speech.
- **Voice:** The voice you want to use for pronunciation.
- **Check more**: [https://platform.openai.com/docs/guides/text-to-speech](https://platform.openai.com/docs/guides/text-to-speech)

## Demo
![demo1](https://github.com/minhhungit/WebSummarizerTranslatorChromeExtension/assets/2279508/febbbd24-a87d-4a75-8046-a45a008980de)
![menu](https://github.com/minhhungit/WebSummarizerTranslatorChromeExtension/assets/2279508/bfc2e665-69fe-45e5-bb23-b7a0c58bcb96)
![settings](https://github.com/minhhungit/WebSummarizerTranslatorChromeExtension/assets/2279508/cab02f16-922d-4193-9109-166a55685304)


## Contributing

Contributions are welcome! Feel free to submit issues, suggest improvements, or create pull requests.

## License

This project is licensed under the [MIT License](LICENSE).
