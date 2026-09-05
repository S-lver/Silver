// ===== Theme Management =====
function getPreferredTheme() {
    const savedTheme = localStorage.getItem('silver-theme');
    if (savedTheme) return savedTheme;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('silver-theme', theme);
    
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        const sun = toggle.querySelector('.sun');
        const moon = toggle.querySelector('.moon');
        if (theme === 'dark') {
            sun.style.opacity = '0';
            sun.style.transform = 'translateY(-20px) rotate(90deg)';
            moon.style.opacity = '1';
            moon.style.transform = 'translateY(0) rotate(0deg)';
        } else {
            sun.style.opacity = '1';
            sun.style.transform = 'translateY(0) rotate(0deg)';
            moon.style.opacity = '0';
            moon.style.transform = 'translateY(20px) rotate(-90deg)';
        }
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// ===== DOM Elements =====
const messagesContainer = document.getElementById('messages-container');
const messagesEl = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const themeToggle = document.getElementById('themeToggle');

// ===== Initialize Theme =====
const initialTheme = getPreferredTheme();
setTheme(initialTheme);

// ===== Theme Toggle Event =====
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// ===== State =====
const conversation = [];
let isProcessing = false;
let welcomeRemoved = false;
const MAX_CONVERSATION = 30;

// ===== Utility Functions =====
function removeWelcome() {
    if (!welcomeRemoved) {
        const welcome = messagesEl.querySelector('.welcome-message');
        if (welcome) {
            welcome.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            welcome.style.opacity = '0';
            welcome.style.transform = 'scale(0.96)';
            setTimeout(() => {
                welcome.remove();
                welcomeRemoved = true;
            }, 500);
        }
    }
}

function addMessage(content, sender) {
    removeWelcome();
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.textContent = content;
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    });
}

function showTyping() {
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.id = 'typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
}

function hideTyping() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        indicator.style.opacity = '0';
        indicator.style.transform = 'scale(0.95)';
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 300);
    }
}

function setInputState(enabled) {
    if (userInput) {
        userInput.disabled = !enabled;
    }
    if (sendBtn) {
        sendBtn.disabled = !enabled;
    }
    if (enabled && userInput) {
        userInput.focus();
    }
}

function trimConversation() {
    while (conversation.length > MAX_CONVERSATION) {
        conversation.splice(0, 2);
    }
}

// ===== Markdown Rendering =====
function renderMarkdown(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    temp.querySelectorAll('pre').forEach((pre) => {
        const code = pre.querySelector('code');
        if (code) {
            const lang = code.className.replace('language-', '');
            if (lang && lang !== 'plaintext' && lang !== 'text') {
                const badge = document.createElement('span');
                badge.className = 'code-language';
                badge.textContent = lang;
                pre.style.position = 'relative';
                pre.appendChild(badge);
            }
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'code-copy-btn';
            copyBtn.textContent = '📋 Copy';
            copyBtn.onclick = (e) => {
                e.stopPropagation();
                const codeText = code.textContent;
                navigator.clipboard.writeText(codeText).then(() => {
                    copyBtn.textContent = '✅ Copied!';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.textContent = '📋 Copy';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }).catch(() => {
                    copyBtn.textContent = '❌ Failed';
                    setTimeout(() => {
                        copyBtn.textContent = '📋 Copy';
                    }, 2000);
                });
            };
            pre.style.position = 'relative';
            pre.appendChild(copyBtn);
        }
    });
    
    return temp.innerHTML;
}

// ===== Send Message (FIXED) =====
async function sendMessage() {
    if (!userInput) return;
    
    const text = userInput.value.trim();
    if (!text || isProcessing) return;

    userInput.value = '';
    isProcessing = true;
    setInputState(false);

    addMessage(text, 'user');
    conversation.push({ role: 'user', content: text });
    trimConversation();

    const typingIndicator = showTyping();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversation }),
        });

        if (!response.ok) {
            let errorMessage = 'Network response was not ok';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        hideTyping();

        // Create bot message container
        const botDiv = document.createElement('div');
        botDiv.className = 'message bot';
        messagesEl.appendChild(botDiv);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let responseComplete = false;
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode and accumulate the buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Split by newlines and process each line
            const lines = buffer.split('\n');
            // Keep the last incomplete line in buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                // Skip empty lines
                if (!line.trim()) continue;
                
                // Check for SSE data prefix
                if (!line.startsWith('data: ')) continue;
                
                const data = line.slice(6).trim();
                
                // Skip [DONE] marker
                if (data === '[DONE]') {
                    continue;
                }

                // Skip empty data
                if (!data) continue;

                try {
                    const parsed = JSON.parse(data);
                    
                    // Check for error
                    if (parsed.error) {
                        throw new Error(parsed.error);
                    }
                    
                    // Check if this is the final processed HTML
                    if (parsed.done && parsed.html) {
                        // Render the fully processed markdown
                        botDiv.innerHTML = renderMarkdown(parsed.html);
                        scrollToBottom();
                        conversation.push({ role: 'assistant', content: fullResponse });
                        trimConversation();
                        responseComplete = true;
                        break;
                    }
                    
                    // Streaming content
                    if (parsed.content !== undefined) {
                        fullResponse += parsed.content;
                        // Show raw text while streaming
                        botDiv.textContent = fullResponse;
                        scrollToBottom();
                    }
                } catch (e) {
                    // Skip invalid JSON (this is normal during streaming)
                    console.debug('Skipping invalid JSON:', data);
                }
            }
            
            // If we got the final HTML, break out of the while loop
            if (responseComplete) {
                break;
            }
        }

        // Fallback: If no final HTML was sent but we have content
        if (!responseComplete && fullResponse) {
            botDiv.textContent = fullResponse;
            conversation.push({ role: 'assistant', content: fullResponse });
            trimConversation();
        }
        
        // If no content at all, show a message
        if (!fullResponse && !responseComplete) {
            botDiv.textContent = '⚠️ No response received. Please try again.';
        }

    } catch (error) {
        hideTyping();
        console.error('Error details:', error);
        
        if (error.message && error.message.toLowerCase().includes('rate limit')) {
            addMessage('⏳ Rate limit exceeded. Please wait a moment and try again.', 'bot');
        } else {
            addMessage('⚠️ Error: ' + error.message + '. Please try again.', 'bot');
        }
    } finally {
        isProcessing = false;
        setInputState(true);
    }
}

// ===== Event Listeners =====
if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
}

if (userInput) {
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// ===== Suggestion Chips =====
document.addEventListener('click', (e) => {
    const chip = e.target.closest('.suggestion-chip');
    if (chip) {
        const prompt = chip.dataset.prompt;
        if (prompt && userInput) {
            userInput.value = prompt;
            sendMessage();
        }
    }
});

// ===== Keyboard shortcut hint =====
const inputHint = document.querySelector('.input-hint');
if (inputHint) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    inputHint.textContent = isMac ? 'Press ⌘⏎ or Enter to send' : 'Press Enter to send';
}

// ===== Health Check =====
async function checkHealth() {
    try {
        const response = await fetch('/api/health');
        if (!response.ok) throw new Error('Health check failed');
        const data = await response.json();
        console.log('🪙 Silver status:', data);
        
        const dot = document.querySelector('.status-dot');
        const text = document.querySelector('.status-text');
        if (dot) {
            dot.style.background = '#34c759';
            dot.style.animation = 'pulse-dot 2s ease-in-out infinite';
        }
        if (text) text.textContent = 'Connected';
    } catch (e) {
        console.warn('⚠️ Could not connect to server.');
        const dot = document.querySelector('.status-dot');
        const text = document.querySelector('.status-text');
        if (dot) {
            dot.style.background = '#ff3b30';
            dot.style.animation = 'none';
        }
        if (text) text.textContent = 'Offline';
    }
}

// ===== Listen for system theme changes =====
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('silver-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// ===== Init =====
setInputState(true);
checkHealth();
setInterval(checkHealth, 30000);

window.addEventListener('load', () => {
    scrollToBottom();
});

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(scrollToBottom, 200);
});
