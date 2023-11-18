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
            for (key of Object.keys(copy))
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

function renderMessages() {
    const messages=chats[currentChatId].messages;
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

function sendMessage(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('message-text');
    const message = convertNewlinesToMarkdown(input.value.trim());
    if (message === '') return;
    packedMessage = {message:{role: "user", content:message}, fulfilled: false}
    const chatID=currentChatId;
    addMessage(chatID, packedMessage);
    input.value = '';
    callOpenAIStream(chatID,chats[chatID].messages.length-1,chats[chatID].settings);
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

async function callOpenAIStream(chatID,index,settings) {
    const context = getContext(chats[chatID].messages, index, settings);
    console.log(context);
    const headers = new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.getAttribute("apiKey")}`
    });
    const data = {
        model: settings.getAttribute("model"),
        messages: context.messages,
        stream: true
    };
    try {
        const response = await fetch(settings.getAttribute('apiUrl')+'/v1/chat/completions', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
        });

        let aiMessage="";
        let aiRole="";
        chats[chatID].messages[index].messageTokens=getTokenNumber(JSON.stringify(chats[chatID].messages[index].message),settings.getAttribute("model"));
        const currentUsage={prompt_tokens:context.tokens+chats[chatID].messages[index].messageTokens,completion_tokens:0,total_tokens:context.tokens+chats[chatID].messages[index].messageTokens}
        let responseIndex=null;
        // Check if the response is okay and supports streaming
        if (response.ok && response.body) {
            const reader = response.body.getReader();
            let finishReason = null;

            // Keep reading the stream until finish_reason is not null
            while (finishReason === null) {
                const { value, done } = await reader.read();
                // Convert the stream from Uint8Array to a string
                const chunk = new TextDecoder().decode(value);

                for (c of chunk.split("\n")){
                    if (c!="")
                    {
                        let data;
                        try
                        {
                            data=JSON.parse(c.slice(5));
                        }
                        catch(error)
                        {
                            continue;
                        }
                        // Check if finish_reason is present and not null
                        if (data.choices!=null && data.choices!=undefined && data.choices.length>0 && data.choices[0].finish_reason != null) {
                            finishReason = data.choices[0].finish_reason;
                            if (finishReason != "stop")
                            {
                                addMessage(chatID, { message: { role: "error", content: `OpenAI: finished with reason ${data.choices[0].finish_reason}.` } });
                            }
                            else
                            {
                                chats[chatID].messages[index].fulfilled = true;
                            }
                        }
                        if (data.choices[0].delta==undefined || data.choices[0].delta.content==undefined) continue;
                        aiMessage += data.choices[0].delta.content;
                        if (aiRole=="") aiRole = data.choices[0].delta.role;
                    }
                }
                currentUsage.completion_tokens=getTokenNumber(aiMessage,settings.getAttribute("model"));
                currentUsage.total_tokens=currentUsage.prompt_tokens+currentUsage.completion_tokens;
                // console.log(aiMessage, currentUsage.completion_tokens);
                if (responseIndex==null) responseIndex=addMessage(chatID, {message: {role:aiRole,content:aiMessage}, usage: currentUsage, messageTokens: currentUsage.completion_tokens});
                else
                {
                    chats[chatID].messages[responseIndex].message.content=aiMessage;
                    chats[chatID].messages[responseIndex].usage=currentUsage;
                    chats[chatID].messages[responseIndex].messageTokens=currentUsage.completion_tokens;
                    // console.log(chats[chatID][responseIndex]);
                }
                saveChats();
                if (chatID==currentChatId) renderMessages();
                if (finishReason!=null) break;
                if (done) {
                    break;
                }
            }
            // console.log('Stream ended with finish reason:', finishReason);
        } else {
            console.error('Network response was not ok.');
            addMessage(chatID, { message: { role: "error", content: `OpenAI: Error communicating with the API.` } });
        }
    } catch (error) {
        console.error('Fetch error:', error);
        addMessage(chatID, { message: { role: "error", content: `OpenAI: Error communicating with the API. Error: ${error}` } });
    }
}

function callOpenAI(chatID,index,settings) {
    const context=getContext(chats[chatID].messages,index,settings);
    console.log(context)
    const data = {
        model: settings.getAttribute("model"),
        messages: context.messages
    };

    fetch(settings.getAttribute('apiUrl')+'/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.getAttribute("apiKey")}`
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data)
        const aiMessage = data.choices[0].message;
        const responseUsage=data.usage;
        chats[chatID].messages[index].fulfilled=true;
        chats[chatID].messages[index].messageTokens=responseUsage.prompt_tokens-context.tokens;
        addMessage(chatID,{message:aiMessage, usage:responseUsage, messageTokens:getTokenNumber(aiMessage,settings.getAttribute('model'))});
    })
    .catch(error => {
        console.error('Error:', error);
        addMessage(chatID,{message:{role:"error", content:'OpenAI: Error communicating with the API.'}});
    });
}

// Add settings button
const settingsButton = document.createElement('button');
settingsButton.textContent = 'Settings';
settingsButton.style.position = 'absolute';
settingsButton.style.top = '10px';
settingsButton.style.right = '10px';
settingsButton.onclick = openSettings;
document.body.appendChild(settingsButton);