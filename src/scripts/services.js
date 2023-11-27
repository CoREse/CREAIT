const ServiceTable={
    "OpenAI Chat Stream": chatOpenAIStream,
    "OpenAI Chat": chatOpenAI,
    "OpenAI Create Image": createImageOpenAI,
    "OpenAI Create Speech": createSpeechOpenAI
}

function convertBlobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function () {
            resolve(reader.result);
        };

        reader.onerror = function (error) {
            reject(error);
        };

        reader.readAsDataURL(blob);
    });
}

// Helper function to create a timeout promise
function createTimeoutPromise(duration) {
    return new Promise((resolve, reject) => {
      // Define the timeout for 10 seconds
      const timeout = duration;
      let timePassed = 0;
  
      // Set up the interval to check the global variable every 0.1 seconds
      const intervalId = setInterval(() => {
        if (stopGenerating) {
          clearInterval(intervalId);
          reject(new Error('Stopped by user.'));
        }
        timePassed += 100;
        if (timePassed >= timeout) {
          clearInterval(intervalId);
          reject(new Error(`Timed out after ${timeout/1000} seconds.`));
        }
      }, 100);
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
            createTimeoutPromise(10000)
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
        if (error.message=='Stopped by user.')
        {
            yield {status:"error", data:{ message: { role: "error", content: error.message }}};
        }
        else if (error.message.slice(0,"Timed out after".length) === 'Timed out after') {
            yield {status:"error", data:{ message: { role: "error", content: error.message }}};
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
            createTimeoutPromise(30000)
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
        if (error.message=='Stopped by user.')
        {
            yield {status:"error", data:{ message: { role: "error", content: error.message }}};
        }
        else if (error.message.slice(0,"Timed out after".length) === 'Timed out after') {
            yield {status:"error", data:{ message: { role: "error", content: error.message }}};
        } else {
            yield {status: "error", data: {message:{role:"error", content:'OpenAI: Error communicating with the API.'}}};
        }
    }
}

async function * createImageOpenAI(apiKey, model, prompt, n=1, size="1024x1024", accessUrl="https://api.openai.com", endpoint='/v1/images/generations') {
    const data = {
        model: model,
        prompt: prompt,
        n: n,
        size: size,
        response_format:"b64_json"
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
            createTimeoutPromise(30000)
        ]) ;
        const rdata=await Promise.race([
            response.json(),
            createTimeoutPromise(10000)
        ])
        yield {status: "completed", data: { message: { role: "assistant", content: `${Object.keys(rdata.data[0]).includes("revised_prompt")?rdata.data[0].revised_prompt:""}<img src="data:image/png;base64,${rdata.data[0].b64_json}"/>`}}};
    }
    catch(error) {
        if (error.message=='Stopped by user.')
        {
            yield {status:"error", data:{ message: { role: "error", content: error.message }}};
        }
        else if (error.message.slice(0,"Timed out after".length) === 'Timed out after') {
            yield {status:"error", data:{ message: { role: "error", content: error.message }}};
        } else {
            yield {status: "error", data: {message:{role:"error", content:'OpenAI: Error communicating with the API.'}}};
        }
    }
}

async function * createSpeechOpenAI(apiKey, model, input, voice="alloy", speed="1.0", response_format="mp3", accessUrl="https://api.openai.com", endpoint='/v1/audio/speech') {
    const data = {
        model: model,
        input: input,
        voice:voice,
        speed: speed,
        response_format:response_format
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
        const blob=await Promise.race([
            response.blob(),
            createTimeoutPromise(10000)
        ])
        const url = await Promise.race([
            convertBlobToBase64(blob),
            createTimeoutPromise(10000)
        ])
        yield {status: "completed", data: { message: { role: "assistant", content: `<audio controls="true" src="${url}" type="audio/mpeg"></audio>`}}};
    }
    catch(error) {
        if (error.message=='Stopped by user.')
        {
            yield {status:"error", data:{ message: { role: "error", content: error.message }}};
        }
        else if (error.message.slice(0,"Timed out after".length) === 'Timed out after') {
            yield {status:"error", data:{ message: { role: "error", content: error.message }}};
        } else {
            yield {status: "error", data: {message:{role:"error", content:'OpenAI: Error communicating with the API.'}}};
        }
    }
}