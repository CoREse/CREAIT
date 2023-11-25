const languages={
    "en-US": {
        "tags": {
            "new-chat-text": {
                "text": "New Chat"
            },
            "open-settings-button": {
                "text": "Settings"
            },
            "open-about-button": {
                "text": "About"
            },
            "settings-title": {
                "text": "Default Settings",
                "chat": "Settings for the Chat"
            },
            "settings-api-url-text": {
                "text": "API URL: "
            },
            "settings-api-key-text": {
                "text": "API key: "
            },
            "settings-model-text": {
                "text": "Model: "
            },
            "settings-other-model-text": {
                "text": "Other model: "
            },
            "settings-context-number-text": {
                "text": "Max context number (exclude current message): "
            },
            "settings-context-tokens-text": {
                "text": "Max context tokens (exclude current message): "
            },
            "settings-language-text": {
                "text": "Language: "
            },
            "settings-selectable-usage-text": {
                "text": "Usage info selectable"
            },
            "close-settings": {
                "text": "Close"
            }
        },
        "Default characters": {
            "asq": {
                "name": "Answer to single query"
            },
            "asq4": {
                "name": "Answer to single query (GPT-4)"
            },
            "Translator": {
                "name": "Translator",
                "content": "You are a language master, translate any English I input to Chinese, or any other language to English."
            },
            "Translator4": {
                "name": "Translator (GPT-4)",
                "content": "You are a language master, translate any English I input to Chinese, or any other language to English."
            },
            "Generate images": {
                "name": "Generate images",
                "content": "This model would generate a image (default 1024*1024) based on your prompt. This character setting is ignored, and the context number is ignored too, it will only answer to one prompt a time."
            },
            "Generate speeches": {
                "name": "Generate speeches",
                "content":"This model would generate a speech based on your input. This character setting is ignored, and the context number is ignored too, it will only answer to one input a time."
            },
            "Just chat": {
                "name": "Just chat",
                "content": "Chat with me."
            }
        },
        "roles":{
            "system": "System",
            "user": "User",
            "assistant": "Assistant",
            "Character Settings": "Character Settings"
        },
        "others": {
            "override-character-confirm" : "You already have a saved character named ${value1}, are you sure to replace it?",
            "delete-character-confirm" : "Are you sure to delete the character ${value1}?",
            "menu-copy": "Copy (Ctrl-C)",
            "menu-cut": "Cut (Ctrl-X)",
            "menu-paste": "Paste (Ctrl-V)",
            "menu-save-image": "Save Image",
            "menu-save-character": "Save to characters",
            "menu-delete-character": "Delete character",
            "menu-rename-chat": "Rename Chat",
            "menu-edit-chat": "Edit Chat",
            "menu-delete-chat": "Delete Chat",
            "token-usage": "Token usage: ${value1} prompt, ${value2} completion, ${value3} total.",
            "message-tokens": "Message tokens: ${value1}.",
            "used-model": " Model: ${value1}.",
            "confirm-yes": "Yes",
            "confirm-no": "No",
            "about-version": "Version: ${value1}",
            "about-author": "Author: ${value1}",
            "about-reset-button": "Clear and Reset",
            "about-close-button": "Close",
            "reset-confirm": "Are you sure to CLEAR ALL data and reset the app?",
            "untitled": "Untitled"
        }
    },
    "zh-CN": {
        "tags": {
            "new-chat-text": {
                "text": "新对话"
            },
            "open-settings-button": {
                "text": "设置"
            },
            "open-about-button": {
                "text": "关于"
            },
            "settings-title": {
                "text": "默认设置",
                "chat": "对话设置"
            },
            "settings-api-url-text": {
                "text": "API地址："
            },
            "settings-api-key-text": {
                "text": "API密钥："
            },
            "settings-model-text": {
                "text": "模型："
            },
            "settings-other-model-text": {
                "text": "自定义模型："
            },
            "settings-context-number-text": {
                "text": "最大上下文消息数量（不包括当前）："
            },
            "settings-context-tokens-text": {
                "text": "最大上下文Token数量（不包括当前）："
            },
            "settings-language-text": {
                "text": "语言："
            },
            "settings-selectable-usage-text": {
                "text": "使用统计可选中"
            },
            "close-settings": {
                "text": "关闭"
            }
        },
        "Default characters": {
            "asq": {
                "name": "一句一问"
            },
            "asq4": {
                "name": "一句一问（GPT-4）"
            },
            "Translator": {
                "name": "翻译",
                "content": "You are a language master, translate any Chinese I input to English, or any other language to Chinese."
            },
            "Translator4": {
                "name": "翻译（GPT-4）",
                "content": "You are a language master, translate any Chinese I input to English, or any other language to Chinese."
            },
            "Generate images": {
                "name": "生成图片",
                "content": "这个模型会根据你的输入生成图片（默认大小1024*1024）。当前的这个角色设定会被忽略，只是给你看的。上下文消息数量设定也会被忽略，它只会针对一条消息生成一次。"
            },
            "Generate speeches": {
                "name": "生成语音",
                "content":"这个模型会根据你的输入生成语音。当前的这个角色设定会被忽略，只是给你看的。上下文消息数量设定也会被忽略，它只会针对一条消息生成一次。"
            },
            "Just chat": {
                "name": "随便聊聊",
                "content": "随便聊聊呗。"
            }
        },
        "roles":{
            "system": "系统",
            "user": "用户",
            "assistant": "助理",
            "Character Settings": "助理角色设定"
        },
        "others": {
            "override-character-confirm" : "你已经有了一个保存的叫“${value1}”的角色，确定要覆盖吗？",
            "delete-character-confirm" : "你确定要删除角色“${value1}”吗？",
            "menu-copy": "复制 (Ctrl-C)",
            "menu-cut": "剪切 (Ctrl-X)",
            "menu-paste": "粘贴 (Ctrl-V)",
            "menu-save-image": "保存图像",
            "menu-save-character": "保存角色",
            "menu-delete-character": "删除角色",
            "menu-rename-chat": "重命名对话",
            "menu-edit-chat": "编辑对话",
            "menu-delete-chat": "删除对话",
            "token-usage": "Token使用：提问${value1}个，回答${value2}个，总共${value3}个。",
            "message-tokens": "此条消息token用量：${value1}个。",
            "used-model": " 模型：${value1}。",
            "confirm-yes": "确定",
            "confirm-no": "取消",
            "about-version": "版本：${value1}",
            "about-author": "作者：${value1}",
            "about-reset-button": "重置应用",
            "about-close-button": "关闭",
            "reset-confirm": "你确定要清除所有数据并重置应用吗？",
            "untitled": "未命名对话"
        }
    }
}