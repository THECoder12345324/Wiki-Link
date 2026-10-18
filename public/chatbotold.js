document.addEventListener('DOMContentLoaded', () => {
    const modelSelector = document.getElementById('modelSelector');
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');

    let selectedModel = '';
    let currentBotMessageElement = null;

    fetchModels();

    modelSelector.addEventListener('change', (e) => {
        selectedModel = e.target.value;
    });

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function fetchModels() {
        fetch('http://localhost:3000/models')
            .then(response => response.json())
            .then(data => {
                if (data.models && Array.isArray(data.models)) {
                    data.models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.name;
                        modelSelector.appendChild(option);
                    });
                    selectedModel = data.models[0].name;
                    modelSelector.value = selectedModel;
                } else {
                    throw new Error('Unexpected format for models data');
                }
            })
            .catch(error => {
                console.error("Error fetching models:", error);
                addMessageToChat('bot', 'Error loading models. Please try again later.', false);
            });
    }

    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addMessageToChat('user', message, true);
            userInput.value = '';
            maxLength = 90000;
            currentBotMessageElement = createMessageElement('bot');
            chatMessages.appendChild(currentBotMessageElement);
            if (pageChangedforBot) {
                var pageTitle = document.getElementsByClassName("result-title")[0];
                var pageContent = document.getElementById("search-results");
                var removeHere = document.getElementById("See_also");
                removeHere?.innerText = "BOT_REMOVE_THIS!@#!@#!@#"
                var truncatedText = pageContent.innerText.slice(0, pageContent.innerText.indexOf("BOT_REMOVE_THIS!@#!@#!@#", 0));
                if (truncatedText > maxLength) {
                    var truncatedText = truncatedText.slice(0, maxLength);
                }
                console.log(pageTitle.innerText);
                console.log(truncatedText)
                newmessage = `I am currently on the page titled ${pageTitle.innerText} and the content of this page are: ${truncatedText}. NEVER PROVIDE DIRECT LINKS.`+ message;
                pageChangedforBot = false;
                removeHere.innerText = "See also";
            } else {
                newmessage = message;
            }
            fetch('http://localhost:3000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        {role: 'user', content: newmessage }],
                    stream: true
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error (`HTTP error! status: ${response.status}`);
                }
                if (response.headers.get('content-type')?.includes('text/event-stream')) {
                    return handleStreamingResponse(response);
                } else {
                    return response.json();
                }
            })
            .then(data => {
                if (data.error) {
                    throw new Error (data.error);
                }

                if (data.response) {
                    updateMessageContent(currentBotMessageElement, data.response, true);
                }
            })
            .catch(error => {
                console.error('Error: ', error);
                updateMessageContent(currentBotMessageElement, `Sorry, there was an error: ${error.message}`, false);
            })
        }
    }

    function handleStreamingResponse(response) {
        return new Promise((resolve, reject) => {
            const reader = response.body.getReader();
            let accumulatedContent = '';
            
            function read() {
                reader.read().then(({done, value}) => {
                    if (done) {
                        resolve({ response: accumulatedContent});
                        return;
                    }

                    const chunk = new TextDecoder("utf-8").decode(value);
                    const lines = chunk.split("\n");

                    lines.forEach(line => {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));
                                if (data.message && data.message.content) {
                                    accumulatedContent += data.message.content;
                                    updateMessageContent(currentBotMessageElement, accumulatedContent, true);
                                }
                            } catch(error) {
                                console.error("Error Parsing stream data:", error, line);
                            }
                        }
                    });
                    
                    read();
                }).catch(reject);
            }

            read();
        })
    }

    function createMessageElement(role) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${role}-message`);
        return messageElement;
    }

    function updateMessageContent(messageElement, content, format = true) {
        if (format) {
            const formattedContent = formatMessage(content);
            messageElement.innerHTML = formattedContent;
        } else {
            messageElement.textContent = DOMPurify.sanitize(content);
        }

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatMessage(content) {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let formattedContent = content.replace(codeBlockRegex, (match, language, code) => {
            language = language || 'plaintext';
            const highlightedCode = hljs.highlight(code.trim(), { language: language }).value;
            const escapedCode = DOMPurify.sanitize(highlightedCode);
            return `<pre><div class="code-header"><span class="code-language">${language}</span><button class="copy-button">Copy</button></div><code class="hljs ${language}">${escapedCode}</code></pre>`;
        })

        // Format inline code
        formattedContent = formattedContent.replace(/`([^`\n]+)`/g, '<code>$1</code>');

        // Use marked for the rest of the content
        formattedContent = DOMPurify.sanitize(marked.parse(formattedContent));

        return formattedContent;
    }

    function addMessageToChat(role, content, format=true) {
        const messageElement = createMessageElement(role);
        updateMessageContent(messageElement, content, format);
        chatMessages.appendChild(messageElement);
    }

    chatMessages.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-button')) {
            const codeElement = e.target.closest('pre').querySelector('code');
            const codeText = codeElement.textContent;

            navigator.clipboard.writeText(codeText)
                .then(() => {
                    e.target.textContent = 'Copied!';
                    setTimeout(() => {
                        e.target.textContent = 'Copy';
                    }, 1500);
                })
                .catch(err => {
                    console.error('Failed to copy code: ', err);
                });
        }
    });
})