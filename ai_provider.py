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
        """Get streaming response from Gemini with proper chat format"""
        try:
            # Extract system prompt and build conversation
            system_prompt = ""
            conversation_history = []
            
            for msg in messages:
                role = msg.get('role')
                content = msg.get('content', '')
                
                if role == 'system':
                    system_prompt = content
                elif role == 'user':
                    conversation_history.append(f"User: {content}")
                elif role == 'assistant':
                    conversation_history.append(f"Assistant: {content}")
            
            # Build the full prompt
            full_prompt = ""
            if system_prompt:
                full_prompt = system_prompt + "\n\n"
            
            # Add conversation history
            if conversation_history:
                full_prompt += "\n".join(conversation_history) + "\n"
            
            # Add the final assistant prompt
            full_prompt += "Assistant: "
            
            # Stream from Gemini
            response = self.model.generate_content(
                full_prompt,
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
