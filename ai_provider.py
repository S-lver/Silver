import os
import google.generativeai as genai
import logging

logger = logging.getLogger(__name__)

class AIProvider:
    def __init__(self):
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if not gemini_key:
            raise Exception("GEMINI_API_KEY not set in environment variables")
        
        genai.configure(api_key=gemini_key)
        
        # List available models and pick the first working one
        self.model = None
        self.model_name = None
        
        # Try these models in order
        models_to_try = [
            "gemini-2.0-flash",
            "gemini-1.5-flash", 
            "gemini-pro",
            "gemini-1.5-pro"
        ]
        
        # Also try to get from environment
        env_model = os.environ.get("GEMINI_MODEL")
        if env_model and env_model not in models_to_try:
            models_to_try.insert(0, env_model)
        
        for model_name in models_to_try:
            try:
                test_model = genai.GenerativeModel(model_name)
                # Test with a simple generation
                test_response = test_model.generate_content("Hi")
                if test_response and test_response.text:
                    self.model = test_model
                    self.model_name = model_name
                    logger.info(f"✅ Using Gemini model: {model_name}")
                    print(f"✅ Using Gemini model: {model_name}")
                    break
            except Exception as e:
                logger.warning(f"Model {model_name} failed: {e}")
                print(f"⚠️ Model {model_name} not available: {e}")
                continue
        
        if not self.model:
            raise Exception("No Gemini models available. Please check your API key.")
    
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
            
            if conversation_history:
                full_prompt += "\n".join(conversation_history) + "\n"
            
            full_prompt += "Assistant: "
            
            # Log the prompt length
            print(f"📝 Prompt length: {len(full_prompt)} chars, using model: {self.model_name}")
            
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
            
            chunk_count = 0
            for chunk in response:
                if chunk.text:
                    chunk_count += 1
                    yield chunk.text
            
            print(f"✅ Generated {chunk_count} chunks from Gemini")
            
            # If no chunks were yielded, raise an error
            if chunk_count == 0:
                raise Exception("Gemini returned empty response")
                    
        except Exception as e:
            print(f"❌ Gemini error: {e}")
            # Re-raise with more context
            raise Exception(f"Gemini API error: {str(e)}")
