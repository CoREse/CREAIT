let currentChatId = null;
let chats = {};
let modelList=[
    'gpt-3.5-turbo-1106',
    'gpt-4-1106-preview'
]

class Settings
{
    constructor(copy=null){
        if (copy!=null)
        {
            for (let key of Object.keys(copy))
            {
                this[key]=copy[key];
            }
        }
    };
    genHeaders(){
        return new Headers({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAttribute("apiKey")}`
        });
    }
    genBody(messages)
    {
        return {
            model: this.getAttribute("model"),
            messages: messages,
            stream: true
        }
    };
    getAttribute(Attr) {
        return this[Attr]==undefined?Settings.defaultSettings[Attr]:this[Attr];
    }
    static defaultSettingsInitial={
        apiKey: '',
        model: 'gpt-3.5-turbo-1106',
        apiUrl: 'https://api.openai.com',
        contextNumber:5,
        contextTokens:8192
    };
    static defaultSettings={...Settings.defaultSettingsInitial};
};

function openSettings(event, settings=null) {
    document.getElementById('settings-dialog').style.display = 'block';
    if (settings==null)
    {
        document.getElementById('api-key').value = Settings.defaultSettings.apiKey;
        document.getElementById('model').value = Settings.defaultSettings.model;
        document.getElementById('api-url').value = Settings.defaultSettings.apiUrl;
        document.getElementById('context-number').value = Settings.defaultSettings.contextNumber;
        document.getElementById('context-tokens').value = Settings.defaultSettings.contextTokens;
    }
    else
    {
        document.getElementById('api-key').value = settings.getAttribute("apiKey");
        document.getElementById('model').value = settings.getAttribute("model");
        document.getElementById('api-url').value = settings.getAttribute("apiUrl");
        document.getElementById('context-number').value = settings.getAttribute("contextNumber");
        document.getElementById('context-tokens').value = settings.getAttribute("contextTokens");
    }
}

function saveSettings(settings=null) {
    if (settings==null)
    {
        Settings.defaultSettings.apiKey = document.getElementById('api-key').value.trim();
        Settings.defaultSettings.model = document.getElementById('model').value.trim();
        Settings.defaultSettings.apiUrl = document.getElementById('api-url').value.trim();
        Settings.defaultSettings.contextNumber=document.getElementById('context-number').value.trim();
        Settings.defaultSettings.contextTokens=document.getElementById('context-tokens').value.trim();
        localStorage.setItem('defaultSettings', JSON.stringify(Settings.defaultSettings));
    }
    else
    {
        for (key of ['api-key', "model", "api-url", "context-number", "context-tokens"])
        {
            const value=document.getElementById(key).value.trim();
            if (value.slice(0, 10)=="*default*") settings[key]=undefined;
            else settings[key]=value;
        }
        saveChats();
    }
    closeSettings();
}

function closeSettings() {
    document.getElementById('settings-dialog').style.display = 'none';
}

function quickChange(event) {
    switch(event.target.id)
    {
        case "quick-model-select":
            chats[currentChatId].settings.model=event.target.value;
            if (event.target.value=='undefined') chats[currentChatId].settings.model=undefined;
            saveChats();
            break;
        case "quick-context-number":
            chats[currentChatId].settings.contextNumber=event.target.value;
            if (event.target.value=='undefined') chats[currentChatId].settings.contextNumber=undefined;
            saveChats();
            quickContextNumberLabel=document.getElementById('quick-context-number-label');
            quickContextNumberLabel.innerHTML=event.target.value;
            break;
        case "quick-reset-context-number":
            chats[currentChatId].settings.contextNumber=undefined;
            saveChats();
            quickContextNumberLabel=document.getElementById('quick-context-number-label');
            quickContextNumberLabel.innerHTML=document.getElementById('quick-context-number').value;
            break;
    }
}

// Load settings and chats from local storage
window.onload = function() {
    loadSettings();
    loadChats();
    renderChats();
};

function loadSettings() {
    const savedDefaultSettings = localStorage.getItem('defaultSettings');
    if (savedDefaultSettings) {
        savedDefaultSettingsObj = JSON.parse(savedDefaultSettings);
        for (const key in savedDefaultSettingsObj) {
            if (key in Settings.defaultSettings) {
                Settings.defaultSettings[key]=savedDefaultSettingsObj[key];
            }
        }
    }
}

function loadChats() {
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
        chats = JSON.parse(savedChats);
    }
    for (chatID of Object.keys(chats))
    {
        chats[chatID].settings=new Settings(chats[chatID].settings);
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

function renderHeader() {
    document.getElementById('chat-title').value="Chat"+ currentChatId;
    const quickModels=document.getElementById('quick-model-select');
    quickModels.innerHTML="";
    for (model of [undefined].concat(modelList))
    {
        const option=document.createElement("option");
        option.value=model;
        option.innerHTML=model==undefined?"*default*"+Settings.defaultSettings.model:model;
        if (model==chats[currentChatId].settings.model) option.selected=true;
        quickModels.appendChild(option);
    }
    const quickContextNumber=document.getElementById('quick-context-number');
    quickContextNumber.value=chats[currentChatId].settings.contextNumber==undefined?Settings.defaultSettings.contextNumber:chats[currentChatId].settings.contextNumber;
    const quickContextNumberLabel=document.getElementById('quick-context-number-label');
    quickContextNumberLabel.innerHTML=quickContextNumber.value;
    
}

function renderMessages() {
    renderHeader();
    const messages=chats[currentChatId].messages;
    const messagePanel = document.getElementById('message-panel');
    messagePanel.innerHTML = '';
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        if (message.message.role != "") messageDiv.classList.add(message.message.role);
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
        if (message.model!=undefined)
        {
            if (usageString!="") usageString+=" ";
            usageString+=` Model: ${message.model}.`
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
    chats[chatId] = {settings: new Settings(), messages:[]};
    currentChatId = chatId;
    renderChats();
    renderMessages();
}

function getTokenNumber(message,model) {
    const encoder=window.tiktoken.encodingForModel(model);
    return encoder.encode(message).length;
}

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
        if (currentChatId) textArea.value=getLastUserMessage(chats[currentChatId].messages);
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

function getService(name="OpenAI Chat Stream")
{
    return ServiceTable[name];
    // return window.services.ServiceTable[name];
}

function sendMessage(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('message-text');
    const message = convertNewlinesToMarkdown(input.value.trim());
    if (message === '') return;
    packedMessage = {message:{role: "user", content:message}, fulfilled: false};
    const chatID=currentChatId;
    packedMessage.messageTokens=getTokenNumber(JSON.stringify(packedMessage.message),chats[chatID].settings.getAttribute("model"));
    addMessage(chatID, packedMessage);
    input.value = '';
    console.log(ServiceTable);
    askService(getService("OpenAI Chat Stream"),chatID,chats[chatID].messages.length-1,chats[chatID].settings);
}

function addMessage(chatID, message, location=null) {
    if (!chatID) return;
    if (location==null) location=chats[chatID].messages.length
    chats[chatID].messages.splice(location,0,message);
    saveChats();
    if (chatID==currentChatId) renderMessages();
    return location;
}

function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

function getContext(messages,index,settings) {
    let context=[];
    if (settings.getAttribute("contextNumber")!=0) context = messages.slice(0,index).filter((m)=>(m.message.role!="error" && (m.hasOwnProperty("fulfilled")?m.fulfilled:true))).slice(-settings.getAttribute("contextNumber"));
    const contextMessage=[];
    let messageTokens=0;
    const reversedContext=context.reverse()
    for (m of reversedContext)
    {
        if (m.messageTokens==undefined) m.messageTokens=getTokenNumber(JSON.stringify(m.message),settings.getAttribute("model"));
        if (messageTokens+m.messageTokens<=settings.getAttribute("contextTokens"))
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

async function askService(service,chatID,index,settings) {
    const context = getContext(chats[chatID].messages, index, settings);
    let responseIndex=null;
    const initialUsage={prompt_tokens:context.tokens+chats[chatID].messages[index].messageTokens,completion_tokens:0,total_tokens:context.tokens+chats[chatID].messages[index].messageTokens}
    for await (const response of service(settings.getAttribute("apiKey"),settings.getAttribute("model"),context.messages, settings.getAttribute("apiUrl"), "/v1/chat/completions"))
    {
        if (response.status=="error") {
            addMessage(chatID, { message: response.data.message });
            saveChats();
            if (currentChatId==chatID) renderMessages();
            break;
        }
        if (responseIndex==null)
        {
            responseIndex=addMessage(chatID, response.data);
            if (response.data.message.role=="") continue;
            if (response.data.usage==undefined)
            {
                chats[chatID].messages[responseIndex].usage=initialUsage;
            }
            chats[chatID].messages[responseIndex].messageTokens=getTokenNumber(JSON.stringify(chats[chatID].messages[responseIndex].message),settings.getAttribute("model"));
        }
        else chats[chatID].messages[responseIndex]=response.data;
        if (response.data.usage==undefined)
        {
            chats[chatID].messages[responseIndex].usage.completion_tokens=getTokenNumber(JSON.stringify(aiMessage),settings.getAttribute("model"));
            chats[chatID].messages[responseIndex].usage.total_tokens=initialUsage.prompt_tokens+chats[chatID].messages[responseIndex].usage.completion_tokens;
        }
        chats[chatID].messages[responseIndex].messageTokens=getTokenNumber(JSON.stringify(chats[chatID].messages[responseIndex].message),settings.getAttribute("model"));
        saveChats();
        if (currentChatId==chatID) renderMessages();
        if (response.status=="completed") {
            chats[chatID].messages[index].fulfilled = true;
            saveChats();
            break;
        }
    }
}