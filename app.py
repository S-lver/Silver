import os
import json
import logging
from datetime import datetime
from flask import Flask, request, Response, jsonify, render_template
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from groq import Groq
import markdown
from bleach import Cleaner

# ===== Setup Logging =====
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===== Load Environment =====
load_dotenv()

# ===== Initialize Flask App =====
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-please-change-in-production')

# ===== Rate Limiter =====
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[
        "200 per day",
        "50 per hour",
        "10 per minute"
    ],
    storage_uri="memory://",
)

# ===== CORS =====
CORS(app)

# ===== Initialize Groq =====
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# ===== Model Configuration =====
MODEL_CONFIG = {
    'fast': 'llama-3.1-8b-instant',
    'balanced': 'llama-3.3-70b-versatile',
    'powerful': 'mixtral-8x7b-32768',
}

# ===== Markdown Processing =====
def process_markdown(text):
    """Convert markdown to safe HTML with syntax highlighting"""
    cleaner = Cleaner(
        tags=[
            'p', 'br', 'strong', 'em', 'u', 'strike', 'del',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote',
            'code', 'pre', 'span', 'div',
            'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
        ],
        attributes={
            'a': ['href', 'title', 'target'],
            'img': ['src', 'alt', 'title'],
            'code': ['class'],
            'span': ['class'],
            'div': ['class'],
            'pre': ['class'],
            '*': ['class']
        },
        styles=[],
        strip=True
    )
    
    html = markdown.markdown(
        text,
        extensions=['fenced_code', 'tables', 'nl2br', 'sane_lists']
    )
    
    return cleaner.clean(html)

# ===== Optimize Messages =====
def optimize_messages(messages, max_history=15):
    """Trim conversation history to save tokens"""
    if not messages:
        return messages
    
    system_msgs = [msg for msg in messages if msg.get('role') == 'system']
    history = [msg for msg in messages if msg.get('role') != 'system']
    trimmed_history = history[-max_history:] if len(history) > max_history else history
    
    return system_msgs + trimmed_history

# ===== Select Model Based on Complexity =====
def select_model(messages):
    """Choose the right model based on conversation complexity"""
    total_chars = sum(
        len(msg.get('content', '')) 
        for msg in messages 
        if msg.get('role') == 'user'
    )
    
    text = ' '.join([msg.get('content', '') for msg in messages])
    has_code = any(keyword in text.lower() for keyword in [
        'code', 'function', 'class', 'import', 'def', '```', 'javascript', 
        'python', 'react', 'html', 'css', 'algorithm', 'debug'
    ])
    
    is_complex = len(text) > 500 or '?' in text and len(text.split()) > 50
    
    if has_code or is_complex:
        return MODEL_CONFIG['balanced']
    elif total_chars < 200:
        return MODEL_CONFIG['fast']
    else:
        return MODEL_CONFIG['balanced']

# ===== Routes =====
@app.route('/')
def home():
    """Serve the chat interface"""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
@limiter.limit("10 per minute")
@limiter.limit("100 per hour")
def chat():
    """Main chat endpoint with rate limiting and markdown support"""
    # Capture all request data BEFORE the generator
    client_ip = request.remote_addr
    user_agent = request.headers.get('User-Agent', 'unknown')
    request_id = datetime.now().strftime('%Y%m%d%H%M%S%f')  # Unique ID for this request
    
    try:
        data = request.json
        if not data or 'messages' not in data:
            return jsonify({'error': 'Missing messages'}), 400
        
        messages = data.get('messages', [])
        
        # Add system prompt if missing
        if not any(msg.get('role') == 'system' for msg in messages):
            messages.insert(0, {
                'role': 'system',
                'content': '''You are Silver, a helpful, concise, and friendly AI assistant.
When responding:
- Use markdown formatting when appropriate (bold, lists, code blocks)
- For code examples, specify the language (e.g., ```python, ```javascript)
- Keep responses well-structured and easy to read
- Be warm and conversational'''
            })
        
        # Optimize conversation
        optimized_messages = optimize_messages(messages, max_history=15)
        
        # Select model
        model = select_model(optimized_messages)
        
        # Calculate estimated tokens
        total_chars = sum(len(msg.get('content', '')) for msg in optimized_messages)
        estimated_tokens = total_chars // 4
        
        # Log the request (outside the generator)
        logger.info(f"Request {request_id}: Model={model}, IP={client_ip}, Messages={len(optimized_messages)}, EstTokens={estimated_tokens}")
        
        # Create streaming completion
        stream = client.chat.completions.create(
            messages=optimized_messages,
            model=model,
            temperature=0.7,
            max_tokens=2048,
            top_p=0.9,
            stream=True,
        )
        
        def generate():
            """Generate streaming response with markdown processing"""
            full_response = ""
            tokens_used = 0
            
            try:
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        tokens_used += len(content) // 4
                        yield f"data: {json.dumps({'content': content, 'full': full_response})}\n\n"
                
                # Process markdown
                try:
                    processed = process_markdown(full_response)
                    yield f"data: {json.dumps({'done': True, 'html': processed})}\n\n"
                except Exception as e:
                    logger.error(f"Markdown processing error: {e}")
                    yield f"data: {json.dumps({'done': True, 'html': full_response})}\n\n"
                
                # Log completion (NO request context here!)
                logger.info(f"Request {request_id}: Complete - Tokens: {estimated_tokens + tokens_used}")
                
            except Exception as e:
                logger.error(f"Request {request_id}: Streaming error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
            yield "data: [DONE]\n\n"
        
        return Response(
            generate(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )
    
    except Exception as e:
        logger.error(f"Request {request_id}: Chat error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
@limiter.exempt
def health():
    """Health check endpoint"""
    return jsonify({
        'status': '🪙 Silver is alive!',
        'timestamp': datetime.now().isoformat(),
        'model': MODEL_CONFIG['balanced'],
        'rate_limits': {
            'per_minute': 10,
            'per_hour': 100,
            'per_day': 200
        },
        'markdown': 'enabled'
    })

@app.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limit exceeded"""
    return jsonify({
        'error': 'Rate limit exceeded. Please slow down.',
        'message': 'You have exceeded the rate limit. Please wait and try again.',
        'limits': '10 requests per minute, 100 per hour, 200 per day'
    }), 429

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(debug=debug, port=port)