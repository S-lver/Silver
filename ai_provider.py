import os
import google.generativeai as genai
from groq import Groq

class AIProvider:
    def __init__(self):
        # Initialize both providers
        self.groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        
        # Configure Gemini
        genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
        self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Choose which provider to use (set in Render env vars)
        self.provider = os.environ.get("AI_PROVIDER", "gemini")  # Default to gemini
        
    def get_response(self, prompt, context=None):
        if self.provider == "gemini":
            return self._gemini_response(prompt, context)
        else:
            return self._groq_response(prompt, context)
    
    def _gemini_response(self, prompt, context=None):
        try:
            if context:
                # If you have chat history, format it for Gemini
                chat = self.gemini_model.start_chat(history=context)
                response = chat.send_message(prompt)
            else:
                response = self.gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini error: {e}")
            # Fallback to Groq if Gemini fails
            return self._groq_response(prompt, context)
    
    def _groq_response(self, prompt, context=None):
        # Your existing Groq logic here
        try:
            # Adjust this to match your existing Groq code
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq error: {e}")
            return "I'm having trouble responding right now. Please try again."
