import os
import google.generativeai as genai

class AIProvider:
    def __init__(self):
        # Initialize Gemini
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if not gemini_key:
            raise Exception("GEMINI_API_KEY not set in environment variables")
        
        genai.configure(api_key=gemini_key)
        
        # Try different model names (in order of preference)
        # gemini-2.0-flash is the latest and fastest
        self.model_name = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
        
        # Alternative models to try if the primary fails
        self.model_fallback_names = [
            "gemini-2.0-flash",
            "gemini-1.5-flash", 
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-1.0-pro"
        ]
        
        self.model = None
        self._init_model()
    
    def _init_model(self):
        """Initialize the model with the first available name"""
        for model_name in [self.model_name] + self.model_fallback_names:
            try:
                # Test if the model is available
                test_model = genai.GenerativeModel(model_name)
                # Try a simple test generation to verify it works
                print(f"✅ Using Gemini model: {model_name}")
                self.model = test_model
                self.model_name = model_name
                return
            except Exception as e:
                print(f"⚠️ Model {model_name} not available: {e}")
                continue
        
        # If we get here, no model worked
        raise Exception("No Gemini models available. Please check your API key and model names.")
    
    def get_streaming_response(self, messages, temperature=0.7, max_tokens=2048, top_p=0.9):
        """Get streaming response from Gemini"""
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
