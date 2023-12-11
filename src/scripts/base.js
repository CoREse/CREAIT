const about={
    version:"v1.0.4",
    author:"CRE (https://github.com/CoREse/CREAIT)",
}
// let texts=null;
// async function loadTexts()
// {
//     texts=await (await fetch("lang/en-US.json")).json();
//     for (key of Object.keys(texts["tags"])) {
//         document.getElementById(key).innerText=texts["tags"][key].text;
//         init();
//     }
// }

class Settings
{
    constructor(copy=null){
        if (copy!=null)
        {
            for (let key of Object.keys(copy))
            {
                this[key]=JSON.parse(JSON.stringify(copy[key]));
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
            'dall-e-2':{service: "OpenAI Create Image", apiUrl:undefined, apiEndpoint:"/v1/images/generations"},
            'dall-e-3':{service: "OpenAI Create Image", apiUrl:undefined, apiEndpoint:"/v1/images/generations"},
            'tts-1':{service: "OpenAI Create Speech", apiUrl:undefined, apiEndpoint:"/v1/audio/speech"},
            'tts-1-hd':{service: "OpenAI Create Speech", apiUrl:undefined, apiEndpoint:"/v1/audio/speech"},
        }
    }
    static initialSavedCharacters={};
    static savedCharacters=JSON.parse(JSON.stringify(Settings.initialSavedCharacters));
};

let currentChatId = null;
let chats = {}
let chatOrder=[];
let selectableUsage=false;
let reloadNeeded=false;
function getLang() {
    lang=navigator.language;
    if (lang.startsWith("zh")) return "zh-CN";
    return "en-US";
}
let language=getLang();
function loadLang() {
    language=getLang();
    if (localStorage.getItem("language")!=null) language=localStorage.getItem("language");
}
function saveLang() {
    localStorage.setItem("language",language);
}
loadLang();
let texts=languages[language];
function init() {
    Settings.initialSavedCharacters[texts["Default characters"]["asq"].name.replaceAll(" ","_")]={name:texts["Default characters"]["asq"].name, settings: new Settings({model:"gpt-3.5-turbo-1106",contextNumber:0}), messages:[{message:{role: "system", content: "You are my personal assistant, answer any question I ask."}}],pinned:true},
    Settings.initialSavedCharacters[texts["Default characters"]["asq4"].name.replaceAll(" ","_")]={name:texts["Default characters"]["asq4"].name, settings: new Settings({model:"gpt-4-1106-preview",contextNumber:0}), messages:[{message:{role: "system", content: "You are my personal assistant, answer any question I ask."}}],pinned:true},
    Settings.initialSavedCharacters[texts["Default characters"]["Translator"].name.replaceAll(" ","_")]={name:texts["Default characters"]["Translator"].name, settings: new Settings({contextNumber:0}), messages:[{message:{role: "system", content: texts["Default characters"].Translator.content}}],pinned:true},
    Settings.initialSavedCharacters[texts["Default characters"]["Translator4"].name.replaceAll(" ","_")]={name:texts["Default characters"]["Translator4"].name, settings: new Settings({model:"gpt-4-1106-preview",contextNumber:0}), messages:[{message:{role: "system", content: texts["Default characters"].Translator4.content}}],pinned:true},
    Settings.initialSavedCharacters[texts["Default characters"]["Generate images"].name.replaceAll(" ","_")]={name:texts["Default characters"]["Generate images"].name, settings: new Settings({model:"dall-e-3",contextNumber:0}), messages:[{message:{role: "system", content: texts["Default characters"]["Generate images"].content}}],pinned:true},
    Settings.initialSavedCharacters[texts["Default characters"]["Generate speeches"].name.replaceAll(" ","_")]={name:texts["Default characters"]["Generate speeches"].name, settings: new Settings({model:"tts-1",contextNumber:0}), messages:[{message:{role: "system", content: texts["Default characters"]["Generate speeches"].content}}],pinned:true},
    Settings.initialSavedCharacters[texts["Default characters"]["Just chat"].name.replaceAll(" ","_")]={name:texts["Default characters"]["Just chat"].name, settings: new Settings(), messages:[{message:{role: "system", content: texts["Default characters"]["Just chat"].content}}], pinned:false},
    Settings.savedCharacters=JSON.parse(JSON.stringify(Settings.initialSavedCharacters));
    chats={
        "0": genChatFromSaved(Settings.savedCharacters[texts["Default characters"]["asq"].name.replaceAll(" ","_")],true),
        "1": genChatFromSaved(Settings.savedCharacters[texts["Default characters"]["asq4"].name.replaceAll(" ","_")],true),
        "2": genChatFromSaved(Settings.savedCharacters[texts["Default characters"]["Translator"].name.replaceAll(" ","_")],true),
        "3": genChatFromSaved(Settings.savedCharacters[texts["Default characters"]["Translator4"].name.replaceAll(" ","_")],true),
        "4": genChatFromSaved(Settings.savedCharacters[texts["Default characters"]["Generate images"].name.replaceAll(" ","_")],true),
        "5": genChatFromSaved(Settings.savedCharacters[texts["Default characters"]["Generate speeches"].name.replaceAll(" ","_")],true),
        "6": genChatFromSaved(Settings.savedCharacters[texts["Default characters"]["Just chat"].name.replaceAll(" ","_")],false),
    }
    chatOrder=["0","1","2","3","4","5","6"];
    for (key of Object.keys(texts["tags"])) {
        try {
            document.getElementById(key).innerText=texts["tags"][key].text;
        } catch (error) {
        }
    }
}
init();

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
        case "language":
            value=event.target.value;
            if (value=="undefined") value=undefined;
            if (value==undefined)
            {
                localStorage.removeItem("language");
            }
            else
            {
                if (event.target.value=="简体中文") {
                    language="zh-CN";
                    saveLang();
                }
                else if (event.target.value=="English") {
                    language="en-US";
                    saveLang();
                }
            }
            reloadNeeded=true;
            break;
        case "selectable-usage":
            if (event.target.checked)
            {
                selectableUsage=true;
                localStorage.setItem("selectableUsage","true");
            }
            else
            {
                selectableUsage=false;
                localStorage.setItem("selectableUsage","false");
            }
            reloadNeeded=true;
            break;
    }
}

function openSettings(event, settings=null) {
    document.getElementById('settings-dialog').style.display = 'block';
    addOverlay();
    let modelList=Object.keys(Settings.settingAlternates.modelSet).concat('[Other]');
    if (settings==null)
    {
        settings=Settings;
        document.getElementById("settings-title").innerHTML=texts.tags["settings-title"].text;
        languageSelect=document.getElementById("language");
        const appSettings=document.getElementsByClassName("app-settings")
        for (s of appSettings)
        {
            s.style.display="block";
            if (s.classList.contains("flex")) s.style.display="flex";
        }
        languageSelect.innerHTML="";
        selected=undefined;
        if (localStorage.getItem("language")!=null) selected=localStorage.getItem("language");
        for (lang of [undefined,"English","简体中文"])
        {
            const option=document.createElement("option");
            option.value=lang;
            option.innerHTML=lang==undefined?"*default*"+getLang(navigator.language):lang;
            if (lang=="English") if (selected=="en-US") option.selected=true;
            if (lang=="简体中文") if (selected=="zh-CN") option.selected=true;
            if (lang==undefined) if (selected==undefined) option.selected=true;
            languageSelect.appendChild(option);
        }
        languageSelect.onchange=function(event) {
            onSettingChange(event, settings);
        };
        selectableUsageInput=document.getElementById("selectable-usage");
        if (selectableUsage) selectableUsageInput.checked=true;
        else selectableUsageInput.checked=false;
        selectableUsageInput.onchange=function(event) {
            onSettingChange(event,settings);
        }
    }
    else
    {
        document.getElementById("settings-title").innerHTML=texts.tags["settings-title"].chat;
        modelList=[undefined].concat(modelList);
        const appSettings=document.getElementsByClassName("app-settings")
        for (s of appSettings) s.style.display="none";
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
    localStorage.setItem('savedCharacters', JSON.stringify(Settings.savedCharacters));
}

function closeSettings() {
    document.getElementById('settings-dialog').style.display = 'none';
    if (reloadNeeded) location.reload();
    removeOverlay();
}

function onChatSettings(event) {
    if(currentChatId!=null) openSettings(event, chats[currentChatId].settings);
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
    if (localStorage.getItem("selectableUsage")!=null) selectableUsage=localStorage.getItem("selectableUsage")=="true";
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
    const savedSavedCharacters = localStorage.getItem('savedCharacters');
    if (savedSavedCharacters) {
        Settings.savedCharacters=JSON.parse(savedSavedCharacters);
    }
}

function toggleLeftPanel(event) {
    if (event.target.getAttribute("id")=="fold-left-panel") {
        document.getElementById("left-panel").style.display = "none";
        document.getElementById("unfold-left-panel").style.display="block";
    }
    else
    {
        document.getElementById("left-panel").style.display = "flex";
        document.getElementById("unfold-left-panel").style.display="none";
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
        if ((chats[a].pinned==true && chats[b].pinned==true) || (chats[a].pinned!==true && chats[b].pinned!==true))
        {
            return chatOrder.indexOf(a)-chatOrder.indexOf(b);
        }
        return chats[a].pinned==true?-1:1;
    });
    localStorage.setItem("chatOrder",JSON.stringify(chatOrder));
    renderChats();
}

function toggleCharacterMenu(event)
{
    event.stopPropagation();
    const div=document.getElementById("character-menu");
    div.style.display = div.style.display === "block" ? "none" : "block";
}

let draggedItem = null;
function renderChats() {
    const chatList = document.getElementById('chat-list');
    // chatList.innerHTML = '<button id="new-chat" onclick="newChat()">New Chat</button>';
    // chatList.innerHTML='<button id="new-chat" onclick="newChat()"><span>New Chat</span><span id="character-button" onclick="toggleCharacterMenu(event)">🤖</span><div id="character-menu" class="dropdown-menu"></div></button>';
    chatList.innerHTML = '';
    const charMenu=document.getElementById("character-menu");
    charMenu.innerHTML="";
    for (key of Object.keys(Settings.savedCharacters))
    {
        const entry=document.createElement("div");
        entry.classList.add("menu-entry");
        entry.id=key.replaceAll(" ","_");
        entry.innerHTML=Settings.savedCharacters[key].name;
        entry.onclick = (event) => {
            event.stopPropagation();
            newChat(event.target.id)
            toggleCharacterMenu(event);
        }
        charMenu.appendChild(entry);
    }
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
        if (chatId==currentChatId) chatdiv.scrollIntoView();
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

function genChatFromSaved(savedChar,pinned=null) {
    const nc= {name:savedChar.name, settings: new Settings(savedChar.settings), messages:JSON.parse(JSON.stringify(savedChar.messages))};
    if (pinned!=null) nc.pinned=pinned;
    return nc;
}

function newChat(savedName=null) {
    if (savedName==null)
    {
        const chatId = Date.now().toString();
        chats[chatId] = {name:texts.others.untitled, settings: new Settings(), messages:[{message:{role: "system", content: ""}}]};
        chatOrder.unshift(chatId);
        reorderChats()
        saveChats();
        switchChat(chatId);
    }
    else
    {
        if (savedName in Settings.savedCharacters)
        {
            const chatId = Date.now().toString();
            const savedChar=Settings.savedCharacters[savedName];
            chats[chatId] = genChatFromSaved(savedChar);
            chatOrder.unshift(chatId);
            reorderChats();
            saveChats();
            switchChat(chatId);
        }
    }
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
    chatDiv.onclick=null;
}

function editChat(event, chatID) {
    openSettings(event,chats[chatID].settings);
}

function deleteChat(event, chatID) {
    delete chats[chatID];
    chatOrder=chatOrder.filter(item => item != chatID);//not frequently called, the efficiency is not that important
    if (currentChatId==chatID)
    {
        currentChatId=null;
        renderHeader();
    }
    saveChats()
    renderChats();
}

function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats));
    localStorage.setItem('chatOrder', JSON.stringify(chatOrder));
}

function saveToCharacters() {
    if (currentChatId==null) return;
    const chat=chats[currentChatId]
    const characterKey=chat.name.replaceAll(" ","_");
    if (characterKey in Settings.savedCharacters) {
        // if (!confirm(`You already have a saved character named ${chat.name}, are you sure to replace it?`)) {
        //     return;
        // }
        userConfirm(texts["others"]["override-character-confirm"].replaceAll("${value1}", chat.name), () => {
            Settings.savedCharacters[characterKey]={name:chat.name, settings: new Settings(chat.settings), messages:[{message:{role: "system", content: chat.messages.length>0 && chat.messages[0].message.role=="system"?chat.messages[0].message.content:""}}]};
            saveSettings();
            renderChats();
        });
    }
    else
    {
        Settings.savedCharacters[characterKey]={name:chat.name, settings: new Settings(chat.settings), messages:[{message:{role: "system", content: chat.messages.length>0 && chat.messages[0].message.role=="system"?chat.messages[0].message.content:""}}]};
        saveSettings();
        renderChats();
    }
}

function deleteCharacter(event) {
    const characterKey=event.target.dataset.ID;
    if (characterKey in Settings.savedCharacters) {
        userConfirm(texts.others["delete-character-confirm"].replaceAll("${value1}",Settings.savedCharacters[characterKey].name), () => {
            delete Settings.savedCharacters[characterKey];
            saveSettings();
            renderChats();
        });
    }
}

function addOverlay()
{
    // Create the overlay
    overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '999'; // Ensure the overlay is below the context menu but above everything else
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.0)'; // Transparent background

    document.body.appendChild(overlay);
    overlayList.push(overlay);
}
function removeOverlay()
{
    if (overlayList.length>0)
    {
        overlay=overlayList.pop();
        overlay.remove();
    }
}

let currentMenu=null;
let overlayList=[];

function isOffspringOf(element, ancestorID)
{
    try
    {
        if (element.id==ancestorID) return true;
        ancestor=element.parentNode;
        while (ancestor!=document)
        {
            if (ancestor.id==ancestorID) return true;
            ancestor=ancestor.parentNode;
        }
    }catch(error)
    {
        return false;
    }
    return false;
}

function isOffspringOfClass(element, ancestorClass)
{
    try
    {
        if (element.classList.contains(ancestorClass)) return true;
        ancestor=element.parentNode;
        while (ancestor!=document)
        {
            if (ancestor.classList.contains(ancestorClass)) return true;
            ancestor=ancestor.parentNode;
        }
    }catch(error)
    {
        return false;
    }
    return false;
}

function mouseOnSelection(event) {
    var selectedText = window.getSelection().toString();
    if (selectedText.length > 0) {
        var selection = window.getSelection().getRangeAt(0);
        var selectedRect = selection.getBoundingClientRect();
        var mouseX = event.clientX;
        var mouseY = event.clientY;

        if (
        mouseX >= selectedRect.left &&
        mouseX <= selectedRect.right &&
        mouseY >= selectedRect.top &&
        mouseY <= selectedRect.bottom
        ) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// Helper function to convert base64 data to a Blob
function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}

function dealingContextMenu(event)
{
    // if (event.target.id=="new-chat" || event.target.parentNode.id=="new-chat") return;
    event.preventDefault();

    if (currentMenu!=null)
    {
        currentMenu.remove();
        currentMenu=null;
        removeOverlay();
    }
    var menu = null
    if (mouseOnSelection(event) || (event.target.nodeName=="INPUT" && (event.target.type=="text" || event.target.type=="number")) || event.target.nodeName=="TEXTAREA")
    {
        menu=document.createElement('div');
        menu.id="context-menu";
        const copyentry=document.createElement("button");
        copyentry.id="context-menu-copy";
        copyentry.innerHTML=texts.others["menu-copy"];
        copyentry.onclick= () => {
            var selectedText = window.getSelection().toString();
            document.execCommand('copy');
        }
        const pasteentry=document.createElement("button");
        pasteentry.id="context-menu-paste";
        pasteentry.innerHTML=texts.others["menu-paste"];
        pasteentry.onclick= () => {
            // var selectedText = window.getSelection().toString();
            document.execCommand('paste');
        }
        menu.appendChild(copyentry);
        if (event.target.nodeName=="INPUT" || event.target.nodeName=="TEXTAREA")
        {
            const cutentry=document.createElement("button");
            cutentry.id="context-menu-cut";
            cutentry.innerHTML=texts.others["menu-cut"];
            cutentry.onclick= () => {
                document.execCommand('cut');
            }
            menu.appendChild(cutentry);
        }
        menu.appendChild(pasteentry);
    }
    else if (event.target.nodeName=="IMG")
    {
        menu=document.createElement('div');
        menu.id="context-menu";
        const copyentry=document.createElement("button");
        copyentry.id="context-menu-copy";
        copyentry.innerHTML=texts.others["menu-copy"];
        copyentry.onclick= async () => {
            try {
                const img = event.target; // The image you want to copy
                const base64Data = img.src.split(',')[1]; // Split the base64 string to get the data part
                const contentType = img.src.match(/data:(.*?);base64,/)[1]; // Extract the content type from the base64 string
                const blob = b64toBlob(base64Data, contentType);
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [blob.type]: blob
                    })
                ]);
                // console.log('Image copied to clipboard');
            } catch (err) {
                // console.error('Failed to copy image: ', err);
                return;
            }
        }
        menu.appendChild(copyentry);
        // Save button
        const saveEntry = document.createElement("button");
        saveEntry.id = "context-menu-save";
        saveEntry.innerHTML = texts.others["menu-save-image"];
        saveEntry.onclick = () => {
            const img = event.target; // The image you want to save
            const a = document.createElement('a');
            a.href = img.src; // The data URL or blob URL of the image
            a.download = 'downloaded-image'; // The default filename for the downloaded image
            document.body.appendChild(a); // Append the anchor to the body
            a.click(); // Simulate a click on the anchor
            document.body.removeChild(a); // Remove the anchor from the body
        };
        menu.appendChild(saveEntry);
    }
    else if (isOffspringOf(event.target,"chat-title") || isOffspringOf(event.target,"chat-character"))
    {
        menu=document.createElement('div');
        menu.id="context-menu";
        menu.innerHTML=`<button onclick="saveToCharacters()">${texts.others["menu-save-character"]}</button>`
    }
    else if (isOffspringOf(event.target,"character-menu"))
    {
        menu=document.createElement('div');
        menu.id="context-menu";
        const characterKey=event.target.id;
        menu.innerHTML=`<button data--i-d="${characterKey}" onclick="deleteCharacter(event)">${texts.others["menu-delete-character"]}</button>`
    }
    else if (isOffspringOf(event.target, "chat-list"))
    {
        let target=event.target;
        if (target.nodeName!='DIV')
        {
            target=target.closest('div');
        }
        if (!target) return;
        if (!target.classList.contains('chat-entry')) return;
        chatID=target.dataset.ID;
        menu=document.createElement('div');
        menu.id="context-menu";
        menu.innerHTML = `<button id="chat-rename" onclick="renameChat(event,${chatID})">${texts.others["menu-rename-chat"]}</button><button id="chat-edit" onclick="editChat(event,${chatID})">${texts.others["menu-edit-chat"]}</button><button id="chat-delete" onclick="deleteChat(event,${chatID})">${texts.others["menu-delete-chat"]}</button>`;
    }
    if (menu==null) return;
    menu.style.position = 'absolute';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid black';
    menu.style.padding = '5px';
    menu.style.zIndex = '1000'; // Ensure the overlay is below the context menu but above everything else

    addOverlay()
    document.body.appendChild(menu);
    // Calculate the menu's position
    var menuWidth = menu.offsetWidth;
    var menuHeight = menu.offsetHeight;
    var pageX = event.pageX;
    var pageY = event.pageY;
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;

    // Check if the menu would go off the right edge of the viewport
    if (pageX + menuWidth > viewportWidth) {
        menu.style.left = (viewportWidth - menuWidth) + 'px';
    } else {
        menu.style.left = pageX + 'px';
    }

    // Check if the menu would go off the bottom edge of the viewport
    if (pageY + menuHeight > viewportHeight) {
        menu.style.top = (pageY - menuHeight) + 'px';
    } else {
        menu.style.top = pageY + 'px';
    }
    currentMenu=menu;
  
    document.addEventListener('click', function() {
        if (currentMenu!=null)
        {
            currentMenu.remove();
            currentMenu=null;
        }
        removeOverlay();
    }, { once: true });
}

document.addEventListener('contextmenu', dealingContextMenu);

//Message part
function renderHeader() {
    if (currentChatId==null) {
        document.getElementById('chat-title').innerText="";
        const quickModels=document.getElementById('quick-model-select');
        quickModels.innerHTML="";
        return;
    }
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
    messageDiv.childNodes[0].focus();
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
    for (let i=0;i< messages.length;++i){
        message =messages[i];
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        if (message.message.role != "") messageDiv.classList.add(message.message.role);
        // messageDiv.innerHTML=message.message.content;
        // messageDiv.innerHTML = window.Prism.highlightElement(marked.parse(message.message.content));//won't work since not every element contains a code tag
        // console.log(message.message.content);
        San=DOMPurify.sanitize(message.message.content)
        sc=message.message.content.split("```");
        ss=San.split("```");
        for (let si=0;si<sc.length;si+=2) sc[si]=ss[si];
        // console.log(sc);
        // console.log(sc.join("```"));
        messageDiv.innerHTML = marked.parse(sc.join("```"));
        const messageIndex=messages.indexOf(message);
        messageDiv.setAttribute("id","message-"+currentChatId+"-"+messageIndex);
        const entryDiv=document.createElement('div');
        entryDiv.classList.add('entry')
        const messageHead=document.createElement('div');
        messageHead.classList.add('message-head');
        const roleName=texts.roles[i==0 &&message.message.role=="system"?"Character Settings":message.message.role];
        if (i==0 && message.message.role) entryDiv.id="chat-character";
        if (message.message.role=="user")
            messageHead.innerHTML=`${roleName}<div class="unselectable message-controls"><button data-chatID="${currentChatId}" data-index="${messageIndex}" onclick="changeMessage(event)">✏️</button><button data-chatID="${currentChatId}" data-index="${messageIndex}" onclick="stopOrReGenerate(event)">${(currentChatId==generatingChatID && messages.indexOf(message)==generatingMessageIndex?"⏹️":"🔃")}</button></div>`;
        else
            messageHead.innerHTML=`${roleName}<div class="unselectable message-controls"><button data-chatID="${currentChatId}" data-index="${messageIndex}" onclick="changeMessage(event)">✏️</button></div>`;
        entryDiv.appendChild(messageHead);
        entryDiv.appendChild(messageDiv)
        let usageString=""
        if (message.usage)
        {
            usageString+=texts.others["token-usage"].replaceAll("${value1}",message.usage.prompt_tokens).replaceAll("${value2}",message.usage.completion_tokens).replaceAll("${value3}",message.usage.total_tokens);
        }
        if (message.messageTokens)
        {
            if (usageString!="") usageString+=" ";
            usageString+=texts.others["message-tokens"].replaceAll("${value1}",message.messageTokens);
        }
        if (message.model!=undefined)
        {
            if (usageString!="") usageString+=" ";
            usageString+=texts.others["used-model"].replaceAll("${value1}",message.model);
        }
        if (usageString!="")
        {
            const usageDiv=document.createElement("div");
            usageDiv.innerHTML=usageString;
            usageDiv.classList.add("usage");
            if (!selectableUsage) usageDiv.classList.add("unselectable");
            entryDiv.appendChild(usageDiv);
        }
        messagePanel.appendChild(entryDiv);
    }
    messagePanel.scrollTop = messagePanel.scrollHeight;
    window.Prism.highlightAll();
}

function getTokenNumber(message,model) {
    try
    {
        const encoder=window.tiktoken.encodingForModel(model);
        return encoder.encode(message).length;
    }
    catch (error)
    {
        return 0;
    }
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
    if (["chatOpenAIStream", "chatOpenAI"].includes(settings.getModelSettings().service)) packedMessage.messageTokens=getTokenNumber(JSON.stringify(packedMessage.message),settings.getAttribute("model"));
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

function getContext(messages,index,settings) {const contextMessage=[];
    const contextNumber=settings.getAttribute("contextNumber");
    const contextTokens=settings.getAttribute("contextTokens");
    let messageNumber=0;
    let messageTokens=0;
    for (let i=index-1;i>=0;--i) {
        if (messageNumber>=contextNumber) break;
        if (messageTokens>=contextTokens) break;
        if (messages[i].message.role=="error") continue;
        if (messages[i].message.role=="system") continue;
        if (messages[i].message.role=="user" && !messages[i].fulfilled) continue;
        if (messages[i].specialType!=undefined && messages[i].specialType!=null) continue;
        if (messages[i].messageTokens==undefined) messages[i].messageTokens=getTokenNumber(JSON.stringify(messages[i].message),settings.getAttribute("model"));
        if (messageTokens+messages[i].messageTokens<=contextTokens)
        {
            contextMessage.unshift(messages[i].message);
            ++messageNumber;
            messageTokens+=messages[i].messageTokens;
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
    if (messages[index].messageTokens==undefined) messages[index].messageTokens=getTokenNumber(JSON.stringify(messages[index].message),settings.getAttribute("model"));
    // messageTokens+=messages[index].messageTokens;
    return {messages:contextMessage,tokens:getTokenNumber(JSON.stringify(contextMessage),settings.getAttribute("model"))};
    // return {messages:contextMessage,tokens:messageTokens};
}

async function askService(service,chatID,index,settings) {
    const context = getContext(chats[chatID].messages, index, settings);
    // console.log(context)
    let responseIndex=null;
    const initialUsage={prompt_tokens:context.tokens,completion_tokens:0,total_tokens:context.tokens}
    
    let ask=null;
    let specialType=null;
    if (["chatOpenAIStream", "chatOpenAI"].includes(service.name))
    {
        ask=service(settings.getAttribute("apiKey"),settings.getAttribute("model"),context.messages, settings.getAttribute("apiUrl"), settings.getModelSettings().apiEndpoint);
    }
    else if (["createImageOpenAI"].includes(service.name))
    {
        ask=service(settings.getAttribute("apiKey"),settings.getAttribute("model"),context.messages[context.messages.length-1].content, 1, "1024x1024", settings.getAttribute("apiUrl"), settings.getModelSettings().apiEndpoint);
        specialType="image";
    }
    else if (["createSpeechOpenAI"].includes(service.name))
    {
        ask=service(settings.getAttribute("apiKey"),settings.getAttribute("model"),context.messages[context.messages.length-1].content, "alloy", "1.0", "mp3", settings.getAttribute("apiUrl"), settings.getModelSettings().apiEndpoint);
        specialType="audio";
    }
    if (ask!=null)
    {
        for await (const response of ask)
        {
            if (response.status=="error") {
                if (response.data.message.content=="Stopped by user.") break;
                addMessage(chatID, { message: response.data.message });
                console.log("[error]", response)
                saveChats();
                if (currentChatId==chatID) renderMessages();
                break;
            }
            if (responseIndex==null)
            {
                responseIndex=addMessage(chatID, JSON.parse(JSON.stringify(response.data)));
                if (response.data.message.role=="") continue;
                if (response.data.usage==undefined)
                {
                    chats[chatID].messages[responseIndex].usage=initialUsage;
                }
                chats[chatID].messages[responseIndex].messageTokens=getTokenNumber(JSON.stringify(chats[chatID].messages[responseIndex].message),settings.getAttribute("model"));
                if (specialType!=null) chats[chatID].messages[responseIndex].specialType=specialType;
            }
            else
            {
                for (key of Object.keys(response.data))
                    chats[chatID].messages[responseIndex][key]=JSON.parse(JSON.stringify(response.data[key]));
            }
            if (response.data.usage==undefined)
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
                if (chats[chatID].name==texts.others.untitled) generateTitle(chatID);
                break;
            }
            if (stopGenerating)
            {
                stopGenerating=false;
                break;
            }
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

function userConfirm(message,yesCallback=null,noCallback=null)
{
    let dialog=document.getElementById('confirm-dialog');
    dialog.innerHTML=`<p>${message}</p>`;
    const yesButton=document.createElement('button');
    yesButton.innerHTML=texts.others["confirm-yes"];
    yesButton.onclick=yes;
    dialog.appendChild(yesButton);
    const noButton=document.createElement('button');
    noButton.innerHTML=texts.others["confirm-no"];
    noButton.onclick=no;
    dialog.appendChild(noButton);
    dialog.style.display = 'flex';
    addOverlay();
    function yes() {
        dialog.style.display = 'none';
        removeOverlay();
        if (yesCallback!=null) yesCallback();
    }
    function no() {
        dialog.style.display = 'none';
        removeOverlay();
        if (noCallback!=null) noCallback();
    }
}

function openAbout(event) {
    aboutDiv=document.getElementById('about-dialog');
    aboutDiv.style.display = 'block';
    aboutDiv.innerHTML=`<p>${texts.others["about-version"].replaceAll("${value1}",about.version)}</p><p>${texts.others["about-author"].replaceAll("${value1}",about.author)}</p><button onclick="reset()">${texts.others["about-reset-button"]}</button><button onclick="closeAbout()">${texts.others["about-close-button"]}</button>`;
}

function reset(event) {
    // if (confirm("Are you sure to CLEAR ALL data and reset the app?"))
    // {
    //     localStorage.clear();
    //     location.reload();
    // }
    userConfirm(texts.others["reset-confirm"],()=>{
        localStorage.clear();
        location.reload();
    });
}

function closeAbout(event) {
    aboutDiv=document.getElementById('about-dialog');
    aboutDiv.style.display = 'none';
}