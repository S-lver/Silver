import os
import google.generativeai as genai

class AIProvider:
    def __init__(self):
        # Initialize Gemini
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if not gemini_key:
            raise Exception("GEMINI_API_KEY not set in environment variables")
        
        genai.configure(api_key=gemini_key)
        # Using gemini-1.5-flash (working model)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        print("✅ Gemini AI initialized successfully")
    
    def get_streaming_response(self, messages, temperature=0.7, max_tokens=2048, top_p=0.9):
        """Get streaming response from Gemini"""
        try:
            # Extract system prompt and conversation
            system_prompt = ""
            conversation = []
            
            for msg in messages:
                if msg.get('role') == 'system':
                    system_prompt = msg.get('content', '')
                else:
                    conversation.append(msg)
            
            # Build the prompt
            prompt = system_prompt + "\n\n" if system_prompt else ""
            for msg in conversation:
                role = "User" if msg.get('role') == 'user' else "Assistant"
                prompt += f"{role}: {msg.get('content', '')}\n"
            prompt += "Assistant: "
            
            # Stream from Gemini
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                    top_p=top_p,
                ),
                stream=True
            )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            print(f"❌ Gemini error: {e}")
            raise Exception(f"Gemini API error: {str(e)}")
