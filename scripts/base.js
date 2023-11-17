let currentChatId = null;
let chats = {};
let settings = {
    apiKey: '',
    defaultModel: 'gpt-3.5-turbo-1106',
    apiUrl: 'https://api.openai.com',
    contextNumber:5,
    contextTokens:8192
};

// Load settings and chats from local storage
window.onload = function() {
    loadSettings();
    loadChats();
    renderChats();
};
// document.getElementById('message-text').addEventListener('keypress', function(event) {
// if (event.key === 'Enter') {
//     sendMessage();
// }
// });
function getLastUserMessage(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].message.role=="user") return messages[i].message.content;
    }
    return "";
}
function handleMessageInput(event) {
    var textArea = event.target;

    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
    if (event.key ==="ArrowUp" && textArea.value=="") 
    {
        if (currentChatId) textArea.value=getLastUserMessage(chats[currentChatId]);
    }
}
function convertNewlinesToMarkdown(text) {
    const parts = text.split(/(```[\s\S]*?```)/);
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
            parts[i] = parts[i].replace(/\n(?!\n)/g, '\n\n');
        }
    }
    return parts.join('');
}

function loadSettings() {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
        savedSettingsObj = JSON.parse(savedSettings);
        for (const key in savedSettingsObj) {
            if (key in settings) {
                settings[key]=savedSettingsObj[key];
            }
        }
    }
}

function loadChats() {
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
        chats = JSON.parse(savedChats);
    }
    if (Object.keys(chats).length!=0)
    {
        currentChatId=Object.keys(chats)[0];
    }
}

function renderChats() {
    const chatList = document.getElementById('chat-list');
    chatList.innerHTML = '<button onclick="newChat()">New Chat</button>';
    Object.keys(chats).forEach(chatId => {
        const button = document.createElement('button');
        if (chatId==currentChatId) button.classList.add("current-chat");
        button.textContent = `Chat ${chatId}`;
        button.onclick = () => switchChat(chatId);
        chatList.appendChild(button);
    });
    if (currentChatId!=null)
    {
        renderMessages();
    }
}

function switchChat(chatId) {
    currentChatId = chatId;
    renderChats();
    renderMessages();
}

function renderMessages() {
    const messages=chats[currentChatId];
    const messagePanel = document.getElementById('message-panel');
    messagePanel.innerHTML = '';
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(message.message.role);
        // messageDiv.innerHTML=message.message.content;
        // messageDiv.innerHTML = window.Prism.highlightElement(marked.parse(message.message.content));//won't work since not every element contains a code tag
        messageDiv.innerHTML = marked.parse(DOMPurify.sanitize(message.message.content));
        const entryDiv=document.createElement('div');
        entryDiv.classList.add('entry')
        entryDiv.innerHTML=message.message.role
        entryDiv.appendChild(messageDiv)
        let usageString=""
        if (message.usage)
        {
            usageString+=`Token usage: ${message.usage.prompt_tokens} prompt, ${message.usage.completion_tokens} completion, ${message.usage.total_tokens} total.`
        }
        if (message.messageTokens)
        {
            if (usageString!="") usageString+=" ";
            usageString+=`Message tokens: ${message.messageTokens}.`
        }
        if (usageString!="")
        {
            const usageDiv=document.createElement("div");
            usageDiv.innerHTML=usageString;
            usageDiv.classList.add("usage");
            entryDiv.appendChild(usageDiv);
        }
        messagePanel.appendChild(entryDiv);
    });
    messagePanel.scrollTop = messagePanel.scrollHeight;
    window.Prism.highlightAll();
}

function newChat() {
    const chatId = Date.now().toString();
    chats[chatId] = [];
    currentChatId = chatId;
    renderChats();
    renderMessages();
}

function sendMessage(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('message-text');
    // const message = input.value.trim();
    const message = convertNewlinesToMarkdown(input.value.trim());
    if (message === '') return;
    packedMessage = {message:{role: "user", content:message}, fulfilled: false}
    const chatID=currentChatId;
    addMessage(chatID, packedMessage);
    input.value = '';
    callOpenAI(chatID,chats[chatID].length-1);
}

function addMessage(chatID, message, location=null) {
    if (!chatID) return;
    if (location==null) location=chats[chatID].length
    chats[chatID].splice(location,0,message);
    saveChats();
    if (chatID==currentChatId) renderMessages();
}

function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

function getContext(messages,index) {
    // console.log(messages)
    let context=[];
    if (settings.contextNumber!=0) context = messages.slice(0,index).filter((m)=>(m.message.role!="error" && (m.hasOwnProperty("fulfilled")?m.fulfilled:true))).slice(-settings.contextNumber);
    // for (let i = index - settings.contextNumber; i <= index; i++) {
    //     if (i < 0) continue;
    //     const message = messages[i];
    //     if (message.message.role === 'user') continue;
    //     context.push(message.message.content);
    // }
    const contextMessage=[];
    let messageTokens=0;
    const reversedContext=context.reverse()
    for (m of reversedContext)
    {
        if (messageTokens+m.messageTokens<=settings.contextTokens)
        {
            contextMessage.unshift(m.message);
            messageTokens+=m.messageTokens;
        }
        else
        {
            break;
        }
    }
    contextMessage.push(messages[index].message)
    return {messages:contextMessage,tokens:messageTokens};
}

function callOpenAI(chatID,index) {
    const context=getContext(chats[chatID],index);
    console.log(context)
    const data = {
        model: settings.defaultModel,
        messages: context.messages
    };

    fetch(settings.apiUrl+'/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data)
        const aiMessage = data.choices[0].message;
        const responseUsage=data.usage;
        chats[chatID][index].fulfilled=true;
        chats[chatID][index].messageTokens=responseUsage.prompt_tokens-context.tokens;
        addMessage(chatID,{message:aiMessage, usage:responseUsage, messageTokens:responseUsage.completion_tokens});
    })
    .catch(error => {
        console.error('Error:', error);
        addMessage(chatID,{message:{role:"error", content:'OpenAI: Error communicating with the API.'}});
    });
}

function openSettings() {
    document.getElementById('settings-dialog').style.display = 'block';
    document.getElementById('api-key').value = settings.apiKey;
    document.getElementById('default-model').value = settings.defaultModel;
    document.getElementById('api-url').value = settings.apiUrl;
    document.getElementById('context-number').value = settings.contextNumber;
    document.getElementById('context-tokens').value = settings.contextTokens;
}

function saveSettings() {
    settings.apiKey = document.getElementById('api-key').value.trim();
    settings.defaultModel = document.getElementById('default-model').value.trim();
    settings.apiUrl = document.getElementById('api-url').value.trim();
    settings.contextNumber=document.getElementById('context-number').value.trim();
    localStorage.setItem('settings', JSON.stringify(settings));
    closeSettings();
}

function closeSettings() {
    document.getElementById('settings-dialog').style.display = 'none';
}

// Add settings button
const settingsButton = document.createElement('button');
settingsButton.textContent = 'Settings';
settingsButton.style.position = 'absolute';
settingsButton.style.top = '10px';
settingsButton.style.right = '10px';
settingsButton.onclick = openSettings;
document.body.appendChild(settingsButton);