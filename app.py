import os
import json
import logging
from datetime import datetime
from flask import Flask, request, Response, jsonify, render_template
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import markdown
from bleach import Cleaner

# Import our AI Provider (Gemini only)
from ai_provider import AIProvider

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

# ===== Initialize AI Provider (Gemini only) =====
try:
    ai_provider = AIProvider()
    logger.info("✅ AI Provider initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize AI Provider: {e}")
    raise

# ===== SVG Emoji Mappings =====
SVG_EMOJIS = {
    "😊": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#FFD93D"/><circle cx="8" cy="10" r="1.5" fill="#333"/><circle cx="16" cy="10" r="1.5" fill="#333"/><path d="M8 14 C8 14, 10 16, 12 16 C14 16, 16 14, 16 14" stroke="#333" stroke-width="2" fill="none"/></svg>',
    "👍": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" fill="#4CAF50"/></svg>',
    "🤖": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><rect x="5" y="8" width="14" height="12" rx="2" fill="#78909C"/><circle cx="9" cy="13" r="1.5" fill="#333"/><circle cx="15" cy="13" r="1.5" fill="#333"/><rect x="10" y="14" width="4" height="2" rx="1" fill="#333"/><rect x="8" y="3" width="3" height="5" rx="1" fill="#78909C"/><rect x="13" y="3" width="3" height="5" rx="1" fill="#78909C"/><circle cx="9" cy="4" r="0.5" fill="#B0BEC5"/><circle cx="15" cy="4" r="0.5" fill="#B0BEC5"/></svg>',
    "🔥": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C12 2 8 6 8 10.5C8 12.4 9.1 14 10.5 14.5C10.2 13.6 10.5 12.6 11.2 11.9C11.9 11.2 12.8 10.8 13.8 11C13.8 11 14 10 13.5 9C13.5 9 14.5 9.5 15 10.5C16 12 16 14 15 16C14 18 12 20 12 20C12 20 16 16 16 11.5C16 7 13 3 12 2Z" fill="#FF6B00"/><path d="M10.5 16C10.5 17.5 11.5 19 13 19C14.5 19 15.5 17.5 15.5 16C15.5 14.5 14.5 13 13 13C11.5 13 10.5 14.5 10.5 16Z" fill="#FF4500"/></svg>',
    "💡": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zM9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z" fill="#FFD700"/></svg>',
    "⭐": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#FFD700"/></svg>',
    "🚀": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C12 2 3 6 3 13c0 4 2 8 9 8s9-4 9-8c0-7-9-11-9-11zM12 19c-4.5 0-7-3-7-6 0-4.5 5.5-8.5 7-9.5 1.5 1 7 5 7 9.5 0 3-2.5 6-7 6z" fill="#00BCD4"/><circle cx="12" cy="13" r="3" fill="#FF5722"/></svg>',
    "✅": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#4CAF50"/></svg>',
    "❌": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" fill="#F44336"/></svg>',
    "🔧": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" fill="#FF9800"/></svg>',
    "👋": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M16.5 2.5c-.8 0-1.5.7-1.5 1.5v7c0 .3-.2.5-.5.5s-.5-.2-.5-.5V3c0-.8-.7-1.5-1.5-1.5S11 2.2 11 3v8.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V4c0-.8-.7-1.5-1.5-1.5S7 3.2 7 4v9.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V6c0-.8-.7-1.5-1.5-1.5S3 5.2 3 6v7.1c0 1.7.7 3.4 1.9 4.6l2.9 2.9c.4.4.9.6 1.4.6h6.3c1.1 0 2.1-.6 2.6-1.6l1.8-3.6c.3-.7.4-1.4.3-2.1V4c0-.8-.7-1.5-1.5-1.5z" fill="#FFB74D"/></svg>',
}

def replace_emojis_with_svg(text):
    """Replace emoji characters with SVG equivalents (skip code blocks)"""
    if not text:
        return text
    
    lines = text.split('\n')
    in_code_block = False
    result = []
    
    for line in lines:
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
        
        if not in_code_block:
            for emoji, svg in SVG_EMOJIS.items():
                line = line.replace(emoji, f'<span class="emoji-svg">{svg}</span>')
        result.append(line)
    
    return '\n'.join(result)

def process_markdown(text):
    """Convert markdown to safe HTML with syntax highlighting and SVG emojis"""
    text = replace_emojis_with_svg(text)
    
    cleaner = Cleaner(
        tags=[
            'p', 'br', 'strong', 'em', 'u', 'strike', 'del',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote',
            'code', 'pre', 'span', 'div',
            'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'svg', 'path', 'circle', 'rect', 'g', 'defs', 'linearGradient', 'stop'
        ],
        attributes={
            'a': ['href', 'title', 'target'],
            'img': ['src', 'alt', 'title'],
            'code': ['class'],
            'span': ['class'],
            'div': ['class'],
            'pre': ['class'],
            '*': ['class'],
            'svg': ['xmlns', 'viewBox', 'width', 'height', 'class'],
            'path': ['d', 'fill', 'stroke', 'stroke-width'],
            'circle': ['cx', 'cy', 'r', 'fill', 'stroke'],
            'rect': ['x', 'y', 'width', 'height', 'rx', 'fill'],
            'g': ['fill', 'transform'],
            'linearGradient': ['id', 'x1', 'y1', 'x2', 'y2'],
            'stop': ['offset', 'stop-color']
        },
        styles=[],
        strip=True
    )
    
    html = markdown.markdown(
        text,
        extensions=['fenced_code', 'tables', 'nl2br', 'sane_lists']
    )
    
    return cleaner.clean(html)

def optimize_messages(messages, max_history=15):
    """Trim conversation history to save tokens"""
    if not messages:
        return messages
    
    system_msgs = [msg for msg in messages if msg.get('role') == 'system']
    history = [msg for msg in messages if msg.get('role') != 'system']
    trimmed_history = history[-max_history:] if len(history) > max_history else history
    
    return system_msgs + trimmed_history

# ===== Routes =====
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
@limiter.limit("10 per minute")
@limiter.limit("100 per hour")
def chat():
    client_ip = request.remote_addr
    request_id = datetime.now().strftime('%Y%m%d%H%M%S%f')
    
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
- Be warm and conversational
- You can use emojis sparingly to add personality to responses'''
            })
        
        optimized_messages = optimize_messages(messages, max_history=15)
        
        logger.info(f"Request {request_id}: IP={client_ip}, Messages={len(optimized_messages)}")
        
        stream_generator = ai_provider.get_streaming_response(
            optimized_messages,
            temperature=0.7,
            max_tokens=2048,
            top_p=0.9
        )
        
        def generate():
            full_response = ""
            
            try:
                for chunk in stream_generator:
                    content = chunk
                    full_response += content
                    # Send each chunk as a separate SSE event
                    yield f"data: {json.dumps({'content': content})}\n\n"
                
                # Process markdown with SVG emojis
                try:
                    processed = process_markdown(full_response)
                    # Send the final HTML with a clear flag
                    yield f"data: {json.dumps({'done': True, 'html': processed})}\n\n"
                except Exception as e:
                    logger.error(f"Markdown processing error: {e}")
                    yield f"data: {json.dumps({'done': True, 'html': full_response})}\n\n"
                
                # Send the [DONE] marker
                yield "data: [DONE]\n\n"
                
                logger.info(f"Request {request_id}: Complete - Response length: {len(full_response)}")
                
            except Exception as e:
                logger.error(f"Request {request_id}: Streaming error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
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
    return jsonify({
        'status': '🪙 Silver is alive!',
        'timestamp': datetime.now().isoformat(),
        'provider': 'Google Gemini',
        'model': 'gemini-1.5-flash',
        'rate_limits': {
            'per_minute': 10,
            'per_hour': 100,
            'per_day': 200
        },
        'markdown': 'enabled',
        'svg_emojis': 'enabled'
    })

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        'error': 'Rate limit exceeded. Please slow down.',
        'message': 'You have exceeded the rate limit. Please wait and try again.',
        'limits': '10 requests per minute, 100 per hour, 200 per day'
    }), 429

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(debug=debug, port=port)
