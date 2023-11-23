const about={
    version:"v0.6.0",
    author:"CRE"
}
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
    isDefault() {
        return false;
    }
    getAttribute(Attr, raw=false) {
        if (raw) return this[Attr];
        if (Attr=="otherModel") return this["otherModel"]==undefined?"":this["otherModel"];
        if (Attr=="model" && this[Attr]=="[Other]") return this.getAttribute("otherModel");
        return this[Attr]==undefined?Settings.getAttribute(Attr):this[Attr];
    }
    setAttribute(Attr,value) {
        return this[Attr]=value;
    }
    getModelSettings() {
        const model=this.getAttribute("model");
        if (model in Settings.settingAlternates.modelSet)
            return Settings.settingAlternates.modelSet[model];
        else return Settings.defaultModelSettings;
    }
    static defaultSettingsInitial={
        apiKey: '',
        model: 'gpt-3.5-turbo-1106',
        apiUrl: 'https://api.openai.com',
        contextNumber:5,
        contextTokens:8192
    };
    static isDefault() {
        return true;
    }
    static getAttribute(Attr,raw=false) {
        if (raw) return Settings.defaultSettings[Attr];
        if (Attr=="otherModel") return Settings.defaultSettings["otherModel"]==undefined?"":Settings.defaultSettings["otherModel"];
        if (Attr=="model" && Settings.defaultSettings[Attr]=="[Other]") return Settings.getAttribute("otherModel");
        return Settings.defaultSettings[Attr];
    }
    static setAttribute(Attr,value) {
        Settings.defaultSettings[Attr]=value;
    }
    static defaultSettings={...Settings.defaultSettingsInitial};
    static settingAlternates={
        apiUrlList:[
            "https://api.openai.com",
        ],
        defaultModelSettings:{service: "OpenAI Chat Stream", apiUrl:undefined, apiEndpoint:"/v1/chat/completions"},
        //current not designed to be modded by users.
        modelSet:{
            'gpt-3.5-turbo-1106':{service: "OpenAI Chat Stream", apiUrl:undefined, apiEndpoint:"/v1/chat/completions"},
            'gpt-4-1106-preview':{service: "OpenAI Chat Stream", apiUrl:undefined, apiEndpoint:"/v1/chat/completions"},
        }
    }
};

let currentChatId = null;
let chats = {
    0:{name:"Answer to single query", settings: new Settings({model:"gpt-3.5-turbo-1106",contextNumber:0}), messages:[{message:{role: "system", content: "You are my personal assistant, answer any question I ask."}}], pinned:true},
    1:{name:"Answer to single query (GPT4)", settings: new Settings({model:"gpt-4-1106-preview",contextNumber:0}), messages:[{message:{role: "system", content: "You are my personal assistant, answer any question I ask."}}], pinned:true},
    2:{name:"Translation", settings: new Settings({contextNumber:0}), messages:[{message:{role: "system", content: "You are a language master, translate any english I input to Chinese, or any other language to English."}}], pinned:true},
    3:{name:"Translation (GPT4)", settings: new Settings({model:"gpt-4-1106-preview",contextNumber:0}), messages:[{message:{role: "system", content: "You are a language master, translate any english I input to Chinese, or any other language to English."}}], pinned:true},
    4:{name:"Just chat", settings: new Settings(), messages:[{message:{role: "system", content: "Chat with me."}}], pinned:false},
};
let chatOrder=[0,1,2,3,4];

function onSettingChange(event, settings)
{
    switch(event.target.id)
    {
        case "api-key":
            settings.setAttribute("apiKey",event.target.value==""?(settings.isDefault()?"":undefined):event.target.value);
            saveSettings();
            saveChats();
            break;
        case "model":
            settings.setAttribute("model",event.target.value);
            if (event.target.value=='undefined') settings.setAttribute("model",undefined);
            saveSettings();
            saveChats();
            if (event.target.value=="[Other]") document.getElementById('other-model-p').style.display="block";
            else document.getElementById('other-model-p').style.display="none";
            break;
        case "other-model":
            settings.setAttribute("otherModel",event.target.value);
            saveSettings();
            saveChats();
            break;
        case "api-url":
            settings.setAttribute("apiUrl",event.target.value==""?(settings.isDefault()?"":undefined):event.target.value);
            saveSettings();
            saveChats();
            break;
        case "context-number":
            settings.setAttribute("contextNumber",event.target.value);
            saveSettings();
            saveChats();
            break;
        case "context-tokens":
            settings.setAttribute("contextTokens",event.target.value);
            saveSettings();
            saveChats();
            break;
    }
}

function openSettings(event, settings=null) {
    document.getElementById('settings-dialog').style.display = 'block';
    let modelList=Object.keys(Settings.settingAlternates.modelSet).concat('[Other]');
    if (settings==null)
    {
        settings=Settings;
        document.getElementById("settings-title").innerHTML="Default Settings";
    }
    else
    {
        document.getElementById("settings-title").innerHTML="Settings for the Chat";
        modelList=[undefined].concat(modelList);
    }
    const apiKeyDiv=document.getElementById('api-key')
    apiKeyDiv.value = settings.getAttribute("apiKey");
    apiKeyDiv.onchange= function(event) {
        onSettingChange(event, settings);
    };
    // document.getElementById('model').value = settings.getAttribute("model");
    const modelDiv=document.getElementById('model')
    modelDiv.innerHTML="";
    modelDiv.onchange=function(event) {
        onSettingChange(event, settings);
    };
    for (model of modelList)
    {
        const option=document.createElement("option");
        option.value=model;
        option.innerHTML=model==undefined?"*default*"+Settings.getAttribute("model"):model;
        if (model==settings.getAttribute("model",true))
        {
            option.selected=true;
        }
        modelDiv.appendChild(option);
    }
    if (settings.getAttribute("model", true)=="[Other]")
    {
        document.getElementById('other-model-p').style.display="block";
        const otherModelDiv=document.getElementById('other-model')
        otherModelDiv.value=settings.getAttribute("otherModel");
        otherModelDiv.onchange=function(event) {
            onSettingChange(event, settings);
        };
    }
    else document.getElementById('other-model-p').style.display="none";
    const apiUrlDiv=document.getElementById('api-url');
    apiUrlDiv.value = settings.getAttribute("apiUrl");
    apiUrlDiv.onchange=function(event) {
        onSettingChange(event, settings);
    };
    const contextNumberDiv=document.getElementById('context-number');
    contextNumberDiv.value = settings.getAttribute("contextNumber");
    contextNumberDiv.onchange=function(event) {
        onSettingChange(event, settings);
    };
    const contextTokensDiv=document.getElementById('context-tokens');
    contextTokensDiv.value = settings.getAttribute("contextTokens");
    contextTokensDiv.onchange=function(event) {
        onSettingChange(event, settings);
    };
}

function saveSettings() {
    localStorage.setItem('defaultSettings', JSON.stringify(Settings.defaultSettings));
    // for (key of ['api-key', "model", "api-url", "context-number", "context-tokens"])
    // {
    //     const value=document.getElementById(key).value.trim();
    //     if (value.slice(0, 10)=="*default*") settings[key]=undefined;
    //     else settings[key]=value;
    // }
    saveChats();
}

function closeSettings() {
    document.getElementById('settings-dialog').style.display = 'none';
}

function onChatSettings(event) {
    openSettings(event, chats[currentChatId].settings);
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
    renderHeader();
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

//Chats part
function loadChats() {
    const savedChats = localStorage.getItem('chats');
    const savedChatOrder = localStorage.getItem('chatOrder');
    if (savedChatOrder)
    {
        chatOrder=JSON.parse(savedChatOrder);
    }
    if (chatOrder==null) chatOrder=[];
    currentChatId=localStorage.getItem('currentChatId');
    if (savedChats) {
        chats = JSON.parse(savedChats);
    }
    for (chatID of Object.keys(chats))
    {
        chats[chatID].settings=new Settings(chats[chatID].settings);
    }
    if (currentChatId==null && Object.keys(chats).length!=0)
    {
        currentChatId=Object.keys(chats)[0];
    }
}

function togglePin(chatId) {
    if (chats[chatId].pinned===true)
    {
        chats[chatId].pinned=false;
    }
    else
    {
        chats[chatId].pinned=true;
    }
    reorderChats();
    saveChats();
}

function reorderChats () {
    // chatOrder.sort((a, b) => chats[a].pinned===true?-1:1);
    chatOrder.sort((a, b) => 
    {
        if ((chats[a].pinned===true && chats[b].pinned==true) || (chats[a].pinned!==true && chats[b].pinned!==true))
        {
            return chatOrder.indexOf(a)-chatOrder.indexOf(b);
        }
        return chats[a].pinned===true?-1:1;
    });
    localStorage.setItem("chatOrder",JSON.stringify(chatOrder));
    renderChats();
}

let draggedItem = null;
function renderChats() {
    const chatList = document.getElementById('chat-list');
    chatList.innerHTML = '<button id="new-chat" onclick="newChat()">New Chat</button>';
    for (let i=0;i<chatOrder.length;++i) {
        const chatId = chatOrder[i];
        const chatdiv = document.createElement('div');
        chatdiv.classList.add("chat-entry");
        chatdiv.id="chat-"+chatId;
        if (chatId==currentChatId) chatdiv.classList.add("current-chat");
        chatdiv.dataset.ID=chatId;
        const tb = document.createElement('i');
        tb.classList.add("fa");
        tb.classList.add("fa-thumb-tack");
        if (chats[chatId].pinned===true) {
            tb.classList.add("unpin");
        }
        else tb.classList.add("pin")
        tb.onclick = () => togglePin(chatId);
        chatdiv.appendChild(tb);
        const cn=document.createElement('span');
        cn.classList.add("chat-name");
        cn.textContent = chats[chatId].name;
        cn.setAttribute("title",cn.textContent);
        // chatdiv.innerHTML = `<i class="pin fa fa-thumb-tack"></i>${chats[chatId].name}`;
        chatdiv.onclick = () => switchChat(chatId);
        chatdiv.appendChild(cn);

        //drag
        chatdiv.setAttribute('draggable', true);

        chatdiv.addEventListener('dragstart', function(e) {
            draggedItem = this;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.id);
            this.classList.add('dragging');
        });

        chatdiv.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('over');
        });

        chatdiv.addEventListener('dragleave', function(e) {
            this.classList.remove('over');
        });

        chatdiv.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('over');
            if (this !== draggedItem) {
                let fromIndex = chatOrder.indexOf(draggedItem.dataset.ID);
                let toIndex = chatOrder.indexOf(this.dataset.ID);
                if (fromIndex < toIndex) {
                    this.parentNode.insertBefore(draggedItem, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(draggedItem, this);
                }
                // Update the chatOrder array to reflect the new order
                chatOrder.splice(toIndex, 0, chatOrder.splice(fromIndex, 1)[0]);
                reorderChats();
            }
        });

        chatdiv.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            draggedItem = null;
        });
        //drag end

        chatList.appendChild(chatdiv);
    }
    if (currentChatId!=null)
    {
        renderMessages();
    }
}

function switchChat(chatId) {
    currentChatId = chatId;
    localStorage.setItem('currentChatId', currentChatId);
    renderChats();
    renderMessages();
}

function newChat() {
    const chatId = Date.now().toString();
    chats[chatId] = {name:"Untitled", settings: new Settings(), messages:[{message:{role: "system", content: ""}}]};
    chatOrder.push(chatId);
    saveChats();
    switchChat(chatId);
}

function renameChat(event, chatID) {
    const chatDiv=document.getElementById("chat-"+chatID);
    // Create a new input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = chatDiv.getElementsByTagName("span")[0].textContent; // Set the input value to the current text
    input.classList.add('chat-input'); // Add any necessary classes

    // Replace the textContent with the input element
    chatDiv.textContent = '';
    chatDiv.appendChild(input);
    input.focus();
    input.select();

    // Event handler for when the input loses focus
    input.addEventListener('blur', function() {
        chats[chatDiv.dataset.ID].name = input.value;
        saveChats();
        renderChats();
    });
    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            chats[chatDiv.dataset.ID].name = input.value;
            saveChats();
            renderChats();
        }
    });
}

function editChat(event, chatID) {
    openSettings(event,chats[chatID].settings);
}

function deleteChat(event, chatID) {
    delete chats[chatID];
    chatOrder=chatOrder.filter(item => item != chatID);//not frequently called, the efficiency is not that important
    if (currentChatId==chatID) currentChatId=null;
    saveChats()
    renderChats();
}

function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats));
    localStorage.setItem('chatOrder', JSON.stringify(chatOrder));
}

let currentMenu=null;
document.getElementById("chat-list").addEventListener('contextmenu', function(event) {
    if (event.target.id=="new-chat") return;
    event.preventDefault();
  
    if (currentMenu!=null)
    {
        currentMenu.remove();
        currentMenu=null;
    }
    let target=event.target;
    if (target.nodeName!='DIV')
    {
        target=target.closest('div');
    }
    if (!target) return;
    if (!target.classList.contains('chat-entry')) return;
    chatID=target.dataset.ID;
    var menu = document.createElement('div');
    menu.innerHTML = `<div id="chat-menu"><button id="chat-rename" onclick="renameChat(event,${chatID})">Rename Chat</button><button id="chat-edit" onclick="editChat(event,${chatID})">Edit Chat</button><button id="chat-delete" onclick="deleteChat(event,${chatID})">Delete Chat</button></div>`;;
    menu.style.position = 'absolute';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid black';
    menu.style.padding = '5px';
  
    document.body.appendChild(menu);
    currentMenu=menu;
  
    document.addEventListener('click', function() {
        if (currentMenu!=null)
        {
            currentMenu.remove();
            currentMenu=null;
        }
    }, { once: true });
});

//Message part
function renderHeader() {
    if (currentChatId==null) return;
    document.getElementById('chat-title').innerText=chats[currentChatId].name;
    const quickModels=document.getElementById('quick-model-select');
    quickModels.innerHTML="";
    for (model of [undefined].concat(Object.keys(Settings.settingAlternates.modelSet)))
    {
        const option=document.createElement("option");
        option.value=model;
        option.innerHTML=model==undefined?"*default*"+Settings.getAttribute("model"):model;
        if (model==chats[currentChatId].settings.model) option.selected=true;
        quickModels.appendChild(option);
    }
    const quickContextNumber=document.getElementById('quick-context-number');
    quickContextNumber.value=chats[currentChatId].settings.contextNumber==undefined?Settings.defaultSettings.contextNumber:chats[currentChatId].settings.contextNumber;
    const quickContextNumberLabel=document.getElementById('quick-context-number-label');
    quickContextNumberLabel.innerHTML=quickContextNumber.value;
}

function messageChange(event) {
    const chatID=event.target.dataset.chatid;
    const messageIndex=event.target.dataset.index;
    const message=chats[chatID].messages[messageIndex];
    message.message.content=event.target.value;
    saveChats();
    renderMessages();
}

function changeMessage(event)
{
    const chatID=event.target.dataset.chatid;
    const messageIndex=event.target.dataset.index;
    const message=chats[chatID].messages[messageIndex];
    const messageDiv=document.getElementById("message-"+chatID+"-"+messageIndex);
    messageDiv.innerHTML=`<textarea onblur="messageChange(event)" class="message-edit" data-chatID="${chatID}" data-index="${messageIndex}">${message.message.content}</textarea>`;
}

function stopOrReGenerate(event)
{
    if (generatingMessageIndex!=null)
    {
        stopGenerating=true;
        generatingChatID=null;
        generatingMessageIndex=null;
        renderMessages();
    }
    else {
        const chatID=event.target.dataset.chatid;
        const messageIndex=event.target.dataset.index;
        document.getElementById("message-input-send").setAttribute("disabled",true);
        generatingChatID=chatID;
        generatingMessageIndex=messageIndex;
        renderMessages();
        askService(getService(chats[chatID].settings.getModelSettings().service),chatID,messageIndex,chats[chatID].settings);
    }
}

let generatingChatID=null;
let generatingMessageIndex=null;
let stopGenerating=false;
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
        const messageIndex=messages.indexOf(message);
        messageDiv.setAttribute("id","message-"+currentChatId+"-"+messageIndex);
        const entryDiv=document.createElement('div');
        entryDiv.classList.add('entry')
        const messageHead=document.createElement('div');
        messageHead.classList.add('message-head');
        const roleName=message.message.role=="system"?"Character Settings":message.message.role;
        if (message.message.role=="user")
            messageHead.innerHTML=`${roleName}<div class="unselectable message-controls"><button data-chatID="${currentChatId}" data-index="${messageIndex}" onclick="changeMessage(event)">✏️</button><button data-chatID="${currentChatId}" data-index="${messageIndex}" onclick="stopOrReGenerate(event)">${(currentChatId==generatingChatID && messages.indexOf(message)==generatingMessageIndex?"⏹️":"🔃")}</button></div>`;
        else
            messageHead.innerHTML=`${roleName}<div class="unselectable message-controls"><button data-chatID="${currentChatId}" data-index="${messageIndex}" onclick="changeMessage(event)">✏️</button></div>`;
        entryDiv.appendChild(messageHead);
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

async function generateTitle(chatID)
{
    const messages=[{role: "system", content: "Summarize a concise name for the conversation based on the content. Give me only the summarized name."}];
    let haveUser=false;
    let haveAssitant=false;
    for (let i=1;i<chats[chatID].messages.length;++i) {
        if (chats[chatID].messages[i].message.role=="user" && chats[chatID].messages[i].fulfilled)
        {
            messages.push(chats[chatID].messages[i].message);
            haveUser=true;
            continue;
        }
        if(haveUser && chats[chatID].messages[i].message.role=="assistant")
        {
            messages.push(chats[chatID].messages[i].message);
            haveAssitant=true;
            break;
        }
    }
    // console.log(messages)
    if (haveUser && haveAssitant)
    {
        for await (const response of getService("OpenAI Chat Stream")(Settings.getAttribute("apiKey"),"gpt-3.5-turbo-1106",messages, Settings.getAttribute("apiUrl"), Settings.settingAlternates.modelSet["gpt-3.5-turbo-1106"].apiEndpoint))
        {
            if (response.status=="error") {
                break;
            }
            if (response.data.message.content!="")
            {
                chats[chatID].name=response.data.message.content;
                saveChats();
                renderChats();
                renderHeader();
            }
            if (response.status=="completed") {
                break;
            }
        }
    }
}

function sendMessage(event,settings=null) {
    if (event) event.preventDefault();
    if (generatingMessageIndex!=null) return;
    if (settings==null) settings=chats[currentChatId].settings;
    const input = document.getElementById('message-text');
    const message = convertNewlinesToMarkdown(input.value.trim());
    if (message === '') return;
    packedMessage = {message:{role: "user", content:message}, fulfilled: false};
    const chatID=currentChatId;
    packedMessage.messageTokens=getTokenNumber(JSON.stringify(packedMessage.message),settings.getAttribute("model"));
    addMessage(chatID, packedMessage);
    input.value = '';
    document.getElementById("message-input-send").setAttribute("disabled",true);
    // console.log(ServiceTable);
    generatingChatID=chatID;
    generatingMessageIndex=chats[chatID].messages.length-1;
    renderMessages();
    askService(getService(settings.getModelSettings().service),chatID,chats[chatID].messages.length-1,chats[chatID].settings);
}

function addMessage(chatID, message, location=null) {
    if (!chatID) return;
    if (location==null) location=chats[chatID].messages.length
    chats[chatID].messages.splice(location,0,message);
    saveChats();
    if (chatID==currentChatId) renderMessages();
    return location;
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
    if (messages[0].message["role"]=="system" && messages[0].message.content!="")
    {
        contextMessage.unshift(messages[0].message);
    }
    contextMessage.push(messages[index].message)
    return {messages:contextMessage,tokens:messageTokens};
}

async function askService(service,chatID,index,settings) {
    const context = getContext(chats[chatID].messages, index, settings);
    // console.log(context)
    let responseIndex=null;
    const initialUsage={prompt_tokens:context.tokens+chats[chatID].messages[index].messageTokens,completion_tokens:0,total_tokens:context.tokens+chats[chatID].messages[index].messageTokens}
    for await (const response of service(settings.getAttribute("apiKey"),settings.getAttribute("model"),context.messages, settings.getAttribute("apiUrl"), settings.getModelSettings().apiEndpoint))
    {
        if (response.status=="error") {
            if (response.data.message.content=="Stopped by user.") break;
            addMessage(chatID, { message: response.data.message });
            console.log("[error]", response)
            saveChats();
            if (currentChatId==chatID) renderMessages();
            break;
        }
        let noUsage=false;
        if (responseIndex==null)
        {
            responseIndex=addMessage(chatID, response.data);
            if (response.data.message.role=="") continue;
            if (response.data.usage==undefined)
            {
                noUsage=true;
                chats[chatID].messages[responseIndex].usage=initialUsage;
            }
            chats[chatID].messages[responseIndex].messageTokens=getTokenNumber(JSON.stringify(chats[chatID].messages[responseIndex].message),settings.getAttribute("model"));
        }
        else chats[chatID].messages[responseIndex]=response.data;
        if (response.data.usage==undefined || noUsage)
        {
            chats[chatID].messages[responseIndex].usage.completion_tokens=getTokenNumber(JSON.stringify(chats[chatID].messages[responseIndex].message),settings.getAttribute("model"));
            chats[chatID].messages[responseIndex].usage.total_tokens=initialUsage.prompt_tokens+chats[chatID].messages[responseIndex].usage.completion_tokens;
        }
        chats[chatID].messages[responseIndex].messageTokens=getTokenNumber(JSON.stringify(chats[chatID].messages[responseIndex].message),settings.getAttribute("model"));
        saveChats();
        if (currentChatId==chatID) renderMessages();
        if (response.status=="completed") {
            chats[chatID].messages[index].fulfilled = true;
            saveChats();
            if (chats[chatID].name=="Untitled") generateTitle(chatID);
            break;
        }
        if (stopGenerating)
        {
            stopGenerating=false;
            break;
        }
    }
    if (stopGenerating)
    {
        stopGenerating=false;
    }
    generatingChatID=null;
    generatingMessageIndex=null;
    document.getElementById("message-input-send").removeAttribute("disabled");
    renderMessages();
}

function openAbout(event) {
    aboutDiv=document.getElementById('about-dialog');
    aboutDiv.style.display = 'block';
    aboutDiv.innerHTML=`<p>Version: ${about.version}</p><p>Author: ${about.author}</p><button onclick="closeAbout()">Close</button>`;
}

function closeAbout(event) {
    aboutDiv=document.getElementById('about-dialog');
    aboutDiv.style.display = 'none';
}