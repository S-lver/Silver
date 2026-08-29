import os
import google.generativeai as genai
from groq import Groq

class AIProvider:
    def __init__(self):
        # Initialize Groq (if key exists)
        self.groq_api_key = os.environ.get("GROQ_API_KEY")
        if self.groq_api_key:
            self.groq_client = Groq(api_key=self.groq_api_key)
        else:
            self.groq_client = None
        
        # Initialize Gemini
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if gemini_key:
            genai.configure(api_key=gemini_key)
            self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.gemini_model = None
        
        # Choose provider
        self.provider = os.environ.get("AI_PROVIDER", "gemini").lower()
        
        print(f"AI Provider initialized: {self.provider}")
    
    def get_streaming_response(self, messages, temperature=0.7, max_tokens=2048, top_p=0.9):
        """Get streaming response from the active provider"""
        if self.provider == "gemini" and self.gemini_model:
            return self._gemini_stream(messages, temperature, max_tokens, top_p)
        elif self.provider == "groq" and self.groq_client:
            return self._groq_stream(messages, temperature, max_tokens, top_p)
        else:
            # Fallback to whichever is available
            if self.gemini_model:
                return self._gemini_stream(messages, temperature, max_tokens, top_p)
            elif self.groq_client:
                return self._groq_stream(messages, temperature, max_tokens, top_p)
            else:
                raise Exception("No AI provider available. Please set GEMINI_API_KEY or GROQ_API_KEY")
    
    def _gemini_stream(self, messages, temperature, max_tokens, top_p):
        """Stream from Gemini"""
        # Extract system prompt and conversation
        system_prompt = ""
        conversation = []
        
        for msg in messages:
            if msg.get('role') == 'system':
                system_prompt = msg.get('content', '')
            else:
                conversation.append(msg)
        
        # Build prompt
        prompt = system_prompt + "\n\n" if system_prompt else ""
        for msg in conversation:
            role = "User" if msg.get('role') == 'user' else "Assistant"
            prompt += f"{role}: {msg.get('content', '')}\n"
        prompt += "Assistant: "
        
        # Stream from Gemini
        try:
            response = self.gemini_model.generate_content(
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
            print(f"Gemini streaming error: {e}")
            # Fallback to Groq if available
            if self.groq_client:
                print("Falling back to Groq")
                yield from self._groq_stream(messages, temperature, max_tokens, top_p)
            else:
                raise e
    
    def _groq_stream(self, messages, temperature, max_tokens, top_p):
        """Stream from Groq"""
        try:
            stream = self.groq_client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                stream=True,
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            print(f"Groq streaming error: {e}")
            raise e
