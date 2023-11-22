const ServiceTable={
    "OpenAI Chat Stream": chatOpenAIStream,
    "OpenAI Chat": chatOpenAI
}

// Helper function to create a timeout promise
function createTimeoutPromise(duration) {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), duration);
    });
};

//response format: {status: "update/completed/error0", data: Object}
//data ={message:{role: "error/${returned by service}", content: "error message/${returned by service}"}[, usage: Object if returned by service][, model: string if returned by service]}
async function * chatOpenAIStream(apiKey, model, messages, accessUrl="https://api.openai.com", endpoint='/v1/chat/completions') {
    const headers = new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    });
    const data = {
        model: model,
        messages: messages,
        stream: true
    };
    try {
        const response = await Promise.race([
            fetch(accessUrl+endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
                }),
            createTimeoutPromise(30000)
        ]);

        let aiMessage="";
        let aiRole="";
        let usedModel=null;
        let responseMessage=null
        // Check if the response is okay and supports streaming
        if (response.ok && response.body) {
            const reader = response.body.getReader();
            let finishReason = null;

            // Keep reading the stream until finish_reason is not null
            while (finishReason === null) {
                const { value, done } = await Promise.race([
                    reader.read(),
                    createTimeoutPromise(10000)
                ]);
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
                        }
                        if (data.choices[0].delta==undefined || data.choices[0].delta.content==undefined) continue;
                        if (usedModel==null) usedModel=data.model;
                        aiMessage += data.choices[0].delta.content;
                        if (aiRole=="") aiRole = data.choices[0].delta.role;
                    }
                }
                // console.log(aiRole,aiMessage)
                if (responseMessage==null) responseMessage={message: {role:aiRole,content:aiMessage}, model:usedModel};
                else
                {
                    responseMessage.message.content=aiMessage;
                }
                yield {status:"update", data: responseMessage};
                if (finishReason!=null) break;
                if (done) {
                    break;
                }
            }
            if (finishReason=="stop") yield {status:"completed", data: responseMessage};
            else yield {status:"error", data: { message: { role: "error", content: `OpenAI: stopped with reason ${finishReason}.` } }};
            // console.log('Stream ended with finish reason:', finishReason);
        } else {
            console.log('Network response was not ok.');
            yield {status:"error", data:  {message: { role: "error", content: `OpenAI: Error communicating with the API.` }} };
        }
    } catch (error) {
        if (error.message === 'Operation timed out') {
            console.error('Timeout error:', error);
            yield {status:"error", data:{ message: { role: "error", content: `OpenAI: Operation timed out after 10 seconds.` }}};
        } else {
            yield {status:"error", data:{ message: { role: "error", content: `OpenAI: Error communicating with the API. Error: ${error}` }}};
        }
    }
}

async function * chatOpenAI(apiKey, model, messages, accessUrl="https://api.openai.com", endpoint='/v1/chat/completions') {
    const data = {
        model: model,
        messages: messages
    };

    try
    {
        const response= await Promise.race([
            fetch(accessUrl+endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(data)
            }),
            createTimeoutPromise(10000)
        ]) ;
        const rdata=await Promise.race([
            response.json(),
            createTimeoutPromise(10000)
        ]) 
        const aiMessage = rdata.choices[0].message;
        const responseUsage=rdata.usage;
        const usedModel=rdata.model;
        yield {status: "completed", data: {message:aiMessage, usage:responseUsage, model:usedModel}};
    }
    catch(error) {
        if (error.message === 'Operation timed out') {
            console.error('Timeout error:', error);
            yield {status:"error", data:{ message: { role: "error", content: `OpenAI: Operation timed out after 10 seconds.` }}};
        } else {
            console.error('Error:', error);
            yield {status: "completed", data: {message:{role:"error", content:'OpenAI: Error communicating with the API.'}}};
        }
    }
}