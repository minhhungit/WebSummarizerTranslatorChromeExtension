function clearTabStorage(tabId){
  let tabIdKey = `store_tab_${tabId}`;
  var obj = {};
  obj[tabIdKey] = [];
  chrome.storage.local.set(obj);
}

function setTabItems(tabId, items, cb){
  let tabIdKey = `store_tab_${tabId}`;

  chrome.storage.local.get([tabIdKey]).then(result => {
    const tabObject = result[tabIdKey] || {};
    Object.keys(items).forEach(itemName => {
      tabObject[itemName] = items[itemName];
    });

    let setObj = {};
    setObj[tabIdKey] = tabObject;

    chrome.storage.local.set(setObj).then(() =>{
      cb && cb();
    });      
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.type === 'getTabItems') {
    let tabIdKey = `store_tab_${sender.tab.id}`;

    chrome.storage.local.get([tabIdKey]).then(result => {
      const items = {};
      (request.itemNames || []).forEach(itemName => {
        items[itemName] = result[tabIdKey] && result[tabIdKey][itemName];
      });  
      sendResponse(items);
    })

    return true; 
  } else if (request.type === 'setTabItems') {

    let tabIdKey = `store_tab_${sender.tab.id}`;
    chrome.storage.local.get(tabIdKey).then(result => {
      const tabObject = result[tabIdKey] || {};
      Object.keys(request.itemNames).forEach(itemName => {
        tabObject[itemName] = request.itemNames[itemName];
      });

      let setObj = {};
      setObj[tabIdKey] = tabObject;
      chrome.storage.local.set(setObj).then(()=>{
        sendResponse({ result: 'success' });
      });      
    });
    
    return true; 
  } else if (request.type === 'removeTabItems') {

    let tabIdKey = `store_tab_${sender.tab.id}`;
    chrome.storage.local.get(tabIdKey).then(result => {
      const tabObject = result[tabIdKey];
      if (tabObject) {
        request.itemNames.forEach(itemName => {
          delete tabObject[itemName];
        });

        let setObj = {};
        setObj[tabIdKey] = tabObject;
        chrome.storage.local.set(setObj).then(()=>{
          sendResponse({ result: 'success' });
        });
      }      
    });
    
    return true; 
  }
  else if (request.type === 'summarize' || request.type === 'translate'|| request.type === 'correct-english' || request.type === 'teach-me' || request.type === 'simple-chat') 
  {
    /*
    request: {
      type: command type, e.g summarize, translate, correct-english
      selectionText: selection text (text that selected on page)
      messages: list all current messages of all roles, include system, user, assistant 
    }
    */
    chrome.storage.sync.get([
      'completionProvider',
      'groqApiUrl', 'groqApiKey', 'groqModelName', 'groqTemperature', 'groqMaxToken', 
      'openAiApiUrl', 'openAiApiKey', 'openAiModelName', 'openAiTemperature', 'openAiMaxToken'
    ], (items) => {
      const completionProvider = items.completionProvider || 'groq';
      
      const apiUrl = completionProvider == "groq" ? items.groqApiUrl : items.openAiApiUrl;
      const apiKey = completionProvider == "groq" ? items.groqApiKey :items.openAiApiKey;
      const modelName = completionProvider == "groq" ? items.groqModelName : items.openAiModelName;
      const temperature = completionProvider == "groq" ? (items.groqTemperature || 0) : (items.openAiTemperature || 0);
      const maxToken = completionProvider == "groq" ? (items.groqMaxToken || 8192) : (items.openAiMaxToken || 4096);

      if (!apiUrl || !apiKey || !modelName) {
        //console.error("API URL or API Key or Model Name not configured.");
        sendResponse({ error: "API not configured" });
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", `Bearer ${apiKey}`);

      let requestBody;
      let requestObj = {};

      switch(request.type){
        case "simple-chat":
          requestObj = {
            messages: [],
            model: modelName, // Replace with your actual model
            temperature: temperature,
            max_tokens: maxToken, //8192, 
            top_p: 1,
            stream: false,
            stop: null
          };
          
          requestObj.messages = request.messages;

          break;
        case "summarize":

          requestObj = {
            messages: [],
            model: modelName, // Replace with your actual model
            temperature: temperature,
            max_tokens: maxToken, //8192, 
            top_p: 1,
            stream: false,
            stop: null
          };

          if (request.selectionText){
            requestObj.messages.push({
              role: "system",
              content: `You are a helpful AI assistant`
            });

            requestObj.messages.push({
              role: "user",
              content: `Bạn có thể vui lòng cung cấp một bản tóm tắt ngắn gọn và đầy đủ về văn bản đã cho không? 
              - Phần tóm tắt phải nắm bắt được những điểm chính, chi tiết chính của văn bản đồng thời truyền tải chính xác ý muốn của tác giả. 
              - Hãy đảm bảo rằng phần tóm tắt được tổ chức tốt và dễ đọc, có tiêu đề các điểm chính và tiêu đề phụ chi tiết bổ sung rõ ràng để hướng dẫn người đọc qua từng phần. 
              - Bao gồm một hoặc hai trích dẫn quan trọng từ tài liệu để minh họa các điểm chính hoặc làm nổi bật thông tin quan trọng.
              - Độ dài của phần tóm tắt phải phù hợp để nắm bắt được những điểm chính và chi tiết chính của văn bản, không đưa vào những thông tin không thật sự cần thiết. 
              - Chỉ tóm tắt theo nội dung được cung cấp, không bịa đặt.
              - Nếu không có yêu cầu đặc biệt, hãy trả lời bằng ngôn ngữ của câu hỏi mà bạn nhận được
              - Câu trả lời phải là định dạng Markdown, có tiêu đề lớn mô tả nội dung, được đặt vào thẻ h2`
            });

            requestObj.messages.push({
              role: "user",
              content: `Dưới đây là nội dung cần tóm tắt (You must always answer in Vietnamese (unless otherwise requested)):\n
${request.selectionText}`
            });
          }
          else{
            requestObj.messages = request.messages;
          }
          
          break;

          case "translate":
            requestObj = {
              messages: [],
              model: modelName, //"llama3-70b-8192", // Replace with your actual model
              temperature: temperature,
              max_tokens: maxToken, 
              top_p: 1,
              stream: false,
              stop: null
            };

            if (request.selectionText){
              requestObj.messages.push({
                role: "system",
                content: `You are a helpful AI assistant`
              });

              requestObj.messages.push({
                role: "user",
                content: `Bạn sẽ được đưa 1 câu văn hoặc đoạn văn bên dưới, hãy dịch nội dung sang tiếng Việt, ngược lại, nếu nội dung được cho là tiếng Việt thì dịch sang tiếng Anh.
YÊU CẦU KHI DỊCH:
- Nếu là code hoặc chứa code thì giữ nguyên phần code - không dịch phần code.
- Phát hiện chủ đề, chuyên ngành của nội dung cần dịch và dịch theo đúng chuyên ngành, ví dụ chuyên ngành công nghệ thông tin, lập trình, trí tuệ nhân tạo, AI, machine learning, LLM (ngôn ngữ lớn), thời trang, kiến trúc...
- Những từ hoặc cụm từ thuộc chuyên ngành thì không cần dịch, vì nếu dịch có thể rất tối nghĩa (nên cố gắng giải thích ý nghĩa ngắn gọn trong ngoặc đơn), ví dụ "fine-tuning" (tinh chỉnh)
- Văn phong tốt, diễn đạt trôi chảy, liền mạch, thể hiện sự thông thạo ngôn ngữ của người bản địa, dựa dựa ngôn ngữ và văn hóa của người Việt Nam, tôn trọng sự giàu đẹp của tiếng Việt
- Bản dịch phải rõ ràng các từ, cụm từ viết tắt của bản gốc.
- Nếu không có yêu cầu đặc biệt, hãy trả lời bằng ngôn ngữ của câu hỏi mà bạn nhận được
- Câu trả lời phải là định dạng Markdown
- Chỉ trả lời kết quả, đừng thêm những câu ở đầu như: 'Here is the translation:', 'Here is the translated content:'...."
`

/*
- Chỉ dịch và không tự ý thêm thông tin gì, nhưng nên có 1 bảng tóm tắt giải thích các từ vựng, loại từ, phiên âm IPA UK/US ở dưới cùng cùng với tên chuyên ngành. 

### Kết quả dịch
- Hiển thị cả bản gốc và bản dịch (nếu câu cần dịch quá dài thì chỉ hiển thị bản dịch)
- Format đoạn văn để tăng tính nhận diện, dễ đọc, dễ thấy

### Thông tin bổ sung
**Phát âm:**
- Phiên âm: Cung cấp phiên âm IPA để người học biết cách phát âm chính xác.

**Ngữ pháp và từ loại:**
- Từ loại: Hiển thị từ loại của từ đó (danh từ, động từ, tính từ, trạng từ, v.v.).
- Hình thái từ: Bao gồm các dạng khác của từ đó (dạng số nhiều, dạng quá khứ, phân từ, v.v.).

**Định nghĩa:**
- Định nghĩa chi tiết: Cung cấp định nghĩa chi tiết của từ trong ngữ cảnh tiếng Anh.
- Định nghĩa đơn giản: Định nghĩa dễ hiểu hoặc phổ biến hơn cho người mới học.

**Ví dụ câu:**
- Câu ví dụ: Cung cấp câu ví dụ để minh họa cách sử dụng từ đó trong ngữ cảnh.
- Dịch câu ví dụ: Dịch các câu ví dụ sang ngôn ngữ của người học để họ hiểu rõ hơn.

**Ngữ cảnh và từ đồng nghĩa/đối nghĩa:**
- Ngữ cảnh: Giải thích các ngữ cảnh khác nhau mà từ đó có thể được sử dụng.
- Từ đồng nghĩa và từ trái nghĩa: Cung cấp danh sách các từ đồng nghĩa và từ trái nghĩa để mở rộng vốn từ vựng.

**Cụm từ liên quan và thành ngữ:**
- Cụm từ liên quan: Các cụm từ hoặc collocations phổ biến liên quan đến từ đó.
- Thành ngữ: Các thành ngữ hoặc idioms chứa từ đó.

**Ghi chú văn hóa và sử dụng đặc biệt:**
- Ghi chú văn hóa: Giải thích các khác biệt văn hóa hoặc các cách sử dụng đặc biệt của từ trong các ngữ cảnh khác nhau.
- Phong cách sử dụng: Chỉ rõ xem từ đó là trang trọng, thân mật, chuyên ngành hay thông dụng.
*/

              });

              requestObj.messages.push({
                role: "user",
                content: `You must always respond in Vietnamese (unless otherwise requested)`
              });
              
              requestObj.messages.push({
                role: "user",
                content: `OK, dưới đây là nội dung cần dịch:\n
${request.selectionText}`
              });
            }else{
              requestObj.messages = request.messages;
            }

          break;

          case "correct-english":

          requestObj = {
            messages: [],
            model: modelName, //"llama3-70b-8192", // Replace with your actual model
            temperature: temperature,
            max_tokens: maxToken, 
            top_p: 1,
            stream: false,
            stop: null
          };

          if (request.selectionText){

            requestObj.messages.push({
              role: "system",
              content: `You are a helpful AI assistant`
            });

            requestObj.messages.push({
              role: "user",
              content: `Bạn sẽ đóng vai là một chuyên gia về ngôn ngữ, có hiểu biết sâu sắc văn hóa bản địa, đặc biệt là tiếng Anh và tiếng Việt, bạn sẽ giúp sửa lỗi tiếng Anh.
- Câu trả lời phải là định dạng markdown
- Đừng đưa ra những câu "introduce prompt words or opening remarks" trong câu trả lời. Hãy đi thẳng vào câu trả lời. Đừng lan man, dài dòng.
- Nếu không có yêu cầu đặc biệt, hãy trả lời bằng ngôn ngữ của câu hỏi mà bạn nhận được
- Từ hoặc câu văn sau khi đã sửa chính xác (ngôn ngữ của câu đã sửa là ngôn ngữ của câu được yêu cầu sửa), ví dụ, bạn được yêu cầu sửa 1 câu tiếng Anh, thì bạn phải trả lời lại 1 câu tiếng Anh đã sửa hoàn chỉnh.
- markdown format, bôi đậm những chỗ đã sửa để highlight, phần giải thích nên được tổ chức tốt, dễ đọc, có outline...
- Nếu câu văn không có lỗi gì, thì chỉ cần nói là không có lỗi, đừng cố bịa ra câu trả lời.`});

// ### Thông tin bổ sung
// **Giải thích lỗi và sửa lỗi:**
// - Mô tả lỗi: Giải thích ngắn gọn lỗi mà người học đã mắc phải (ví dụ: sai ngữ pháp, sai chính tả, sử dụng từ không chính xác, v.v.).
// - Nguyên nhân phổ biến: Cung cấp thông tin về lý do tại sao lỗi này thường xảy ra và làm sao để tránh nó.
// - Cách sửa: Cung cấp giải pháp cụ thể để sửa lỗi.
// - Ví dụ đúng: Cung cấp ví dụ minh họa cách sử dụng đúng.

// **Quy tắc ngữ pháp liên quan:**
// - Quy tắc ngữ pháp: Cung cấp quy tắc ngữ pháp liên quan đến lỗi để người học có thể nắm rõ hơn.
// - Ghi chú ngữ pháp: Giải thích chi tiết hơn về các quy tắc ngữ pháp phức tạp nếu cần.

            requestObj.messages.push({
              role: "user",
              content: `You must always answer in Vietnamese, unless otherwise is requested.`
            });

            requestObj.messages.push({
              role: "user",
              content: `OK, dưới đây là câu cần sửa (just correct English grammar, don't translate it):\n
${request.selectionText}`
            });
          }else{
            requestObj.messages = request.messages;
          }

          break;

          case "teach-me":

          requestObj = {
            messages: [],
            model: modelName, //"llama3-70b-8192", // Replace with your actual model
            temperature: temperature,
            max_tokens: maxToken, 
            top_p: 1,
            stream: false,
            stop: null
          };

          if (request.selectionText){

            requestObj.messages.push({
              role: "system",
              content: `You are a knowledgeable and engaging teacher. 
              Your goal is to educate the user about various topics they might be interested in.
              Make sure the content is well-organized and easy to read, with clear main headings and subheadings that provide detailed supplementary information to guide learners through each section, making it easy for them to follow along. 
              Provide clear explanations, examples, and answer any questions the user may have. 
              Make sure to break down complex concepts into simpler terms and relate them to real-world applications when possible.               
              Be patient, encouraging, and responsive to the user's level of understanding. 
              Adapt your teaching style based on the user's feedback and engagement. 
              Always strive to make learning enjoyable and accessible.
              IMPORTANT: Be honest, don't make things up.
              IMPORTANT: You must always answer in Vietnamese, unless otherwise is requested.`
            });

            requestObj.messages.push({
              role: "user",
              content: `OK, please teach me this (always answer me in Vietnamese please from now):\n
${request.selectionText}`
            });
          }else{
            requestObj.messages = request.messages;
          }

          break;
      }

      let defaultMessages = JSON.parse(JSON.stringify(requestObj.messages));

      //console.log(requestObj);

      requestBody = JSON.stringify(requestObj);

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: requestBody,
        redirect: "follow"
      };

      fetch(apiUrl, requestOptions)
        .then(response => response.json())
        .then(data => {
          console.log("API Response:", data); 

          if (data.choices && data.choices[0] && data.choices[0].message) {
            msg = data.choices[0].message.content;

            requestObj.messages.push({
              role: "assistant",
              content: msg
            });

            setTabItems(sender.tab.id, {
              defaultMessages: defaultMessages,
              lastSelectedCommand: request.type,
              chatMessages: requestObj.messages
            }, ()=>{
              sendResponse({ result: msg });
            });
            // chrome.tabs.sendMessage(sender.tab.id, { 
            //   type: 'setTabItems', 
            //   itemNames: {
            //     defaultMessages: defaultMessages,
            //     lastSelectedCommand: request.type,
            //     chatMessages: requestObj.messages
            //   }
            // }, res => {
            //   sendResponse({ result: msg });
            // });       
            // return true; 

          } else {
            let msg = data.error.message;
            requestObj.messages.push({
              role: "assistant",
              content: msg
            });

            setTabItems(sender.tab.id, {
              defaultMessages: defaultMessages,
              lastSelectedCommand: request.type,
              chatMessages: requestObj.messages
            }, ()=>{
              sendResponse({ error: msg });
            });

            // chrome.tabs.sendMessage(sender.tab.id, { 
            //   type: 'setTabItems', 
            //   itemNames: {
            //     defaultMessages: defaultMessages,
            //     lastSelectedCommand: request.type,
            //     chatMessages: requestObj.messages
            //   }
            // }, res => {
            //   sendResponse({ error: msg });
            // });

            return true; 
          }
        })
        .catch(error => {
          //console.error('Error during API request:', error);

          let msg = 'API request failed: ' + error.message;

          requestObj.messages.push({
            role: "assistant",
            content: msg
          });

          setTabItems(sender.tab.id,  {
            defaultMessages: defaultMessages,
            lastSelectedCommand: request.type,
            chatMessages: requestObj.messages
          }, ()=>{
            sendResponse({ error: msg });
          });

          // chrome.tabs.sendMessage(sender.tab.id, { 
          //   type: 'setTabItems', 
          //   itemNames: {
          //     defaultMessages: defaultMessages,
          //     lastSelectedCommand: request.type,
          //     chatMessages: requestObj.messages
          //   }
          // }, res => {
          //   sendResponse({ error: msg });
          // });

          return true; 
        });

        return true; 
    });

    // Keep the message channel open
    return true; 
  }
});

chrome.contextMenus.removeAll();

// Create context menu items
chrome.contextMenus.create({
  id: "simple-chat",
  title: "Simple Chat",
  contexts: ["page"]
});

chrome.contextMenus.create({
  id: "summarize",
  title: "✨ Summarize Selection",
  contexts: ["selection"]
});

chrome.contextMenus.create({
  id: "translate",
  title: "🌏 Translate Selection",
  contexts: ["selection"]
});

chrome.contextMenus.create({
  id: "correct-english",
  title: "👌 Correct English",
  contexts: ["selection"]
});

chrome.contextMenus.create({
  id: "teach-me",
  title: "🎓 Teach Me This",
  contexts: ["selection"]
});


chrome.contextMenus.create({
  id: "pronounce",
  title: "🔉 Pronounce",
  contexts: ["selection"]
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'summarize' || 
    info.menuItemId === 'translate' || 
    info.menuItemId === 'correct-english' || 
    info.menuItemId === 'teach-me' ||
    info.menuItemId === 'pronounce' ||
    info.menuItemId === 'simple-chat'
  ) {

    //reset chat message
    setTabItems(tab.id, {
      chatMessages: [],
      lastSelectedCommand: info.menuItemId
    }, ()=>{
      // Send the message to the content script 
      chrome.tabs.sendMessage(tab.id, { 
        type: info.menuItemId, 
        selectionText: info.selectionText,
        isNewChat: true
      }, (response) => { 
        // Handle the response from background.js (via content.js)
        // if (response.error) {
        //   console.error(response.error);
        //   alert("An error occurred: " + response.error); 
        // } else {
        //   alert(response.result);
        // }
      });
    });

    

    // clearTabStorage(tab.id);

    // chrome.tabs.sendMessage(tab.id, { 
    //   type: 'setTabItems', 
    //   itemNames: {chatMessages: []}
    // }, res => {});

    
  }

});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // Set a default value for the tab
  //setTabItemValue(tabId, 'foo', 'bar');
});

// Listen for tab removals
chrome.tabs.onRemoved.addListener(function(tabId) {
  clearTabStorage(tabId);
});