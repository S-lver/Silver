// ===== Theme Management =====
function getPreferredTheme() {
    // Check localStorage first
    const savedTheme = localStorage.getItem('silver-theme');
    if (savedTheme) return savedTheme;
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('silver-theme', theme);
    
    // Update button icon state
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
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
        setTimeout(() => indicator.remove(), 300);
    }
}

function setInputState(enabled) {
    userInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
    if (enabled) {
        userInput.focus();
    }
}

// ===== Send Message =====

// ===== Markdown Rendering =====
function renderMarkdown(html) {
    // Create a temporary container
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Find all code blocks and add copy buttons
    temp.querySelectorAll('pre').forEach((pre) => {
        // Add language badge
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
            
            // Add copy button
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
    const text = userInput.value.trim();
    if (!text || isProcessing) return;

    userInput.value = '';
    isProcessing = true;
    setInputState(false);

    addMessage(text, 'user');
    conversation.push({ role: 'user', content: text });

    showTyping();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversation }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Network response was not ok');
        }

        hideTyping();

        // Create bot message container with markdown support
        const botDiv = document.createElement('div');
        botDiv.className = 'message bot';
        messagesEl.appendChild(botDiv);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let responseComplete = false;

        while (true) {
            const { done, value } = await reader.read();
            
            // If the stream is done, break out
            if (done) {
                break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    
                    // Skip empty data or [DONE] messages
                    if (!data || data === '[DONE]') {
                        continue;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        
                        // Check if this is the final processed HTML
                        if (parsed.done && parsed.html) {
                            // Render the fully processed markdown
                            botDiv.innerHTML = renderMarkdown(parsed.html);
                            scrollToBottom();
                            conversation.push({ role: 'assistant', content: fullResponse });
                            responseComplete = true;
                            break;
                        }
                        
                        // Streaming content
                        if (parsed.content) {
                            fullResponse += parsed.content;
                            // Show raw text while streaming
                            botDiv.textContent = fullResponse;
                            scrollToBottom();
                        }
                    } catch (e) {
                        // Skip invalid JSON (this is normal during streaming)
                        console.debug('Skipping invalid JSON:', e);
                    }
                }
            }
            
            // If we got the final HTML, break out of the while loop
            if (responseComplete) {
                break;
            }
        }

        // Fallback: If no final HTML was sent but we have content
        if (!responseComplete && fullResponse) {
            // Simple fallback: just show the raw text
            botDiv.textContent = fullResponse;
            conversation.push({ role: 'assistant', content: fullResponse });
        }

    } catch (error) {
        hideTyping();
        console.error('Error details:', error);
        
        // Check if it's a rate limit error
        if (error.message && error.message.includes('Rate limit')) {
            addMessage('⏳ Rate limit exceeded. Please wait a moment and try again.', 'bot');
        } else {
            addMessage('⚠️ Connection error. Please try again.', 'bot');
        }
    } finally {
        isProcessing = false;
        setInputState(true);
    }
}
// ===== Event Listeners =====
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// ===== Suggestion Chips =====
document.addEventListener('click', (e) => {
    const chip = e.target.closest('.suggestion-chip');
    if (chip) {
        const prompt = chip.dataset.prompt;
        if (prompt) {
            userInput.value = prompt;
            sendMessage();
        }
    }
});

// ===== Keyboard shortcut hint =====
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
if (isMac) {
    document.querySelector('.input-hint').textContent = 'Press ⌘⏎ or Enter to send';
}

// ===== Health Check =====
async function checkHealth() {
    try {
        const response = await fetch('/api/health');
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
    // Only change if user hasn't manually set a theme
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