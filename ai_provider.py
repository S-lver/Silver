import os
import logging
from google import genai

logger = logging.getLogger(__name__)


class AIProvider:
    def __init__(self):
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if not gemini_key:
            raise Exception("GEMINI_API_KEY not set in environment variables")

        self.client = genai.Client(api_key=gemini_key)

        # Model preference order — per Google's current docs
        models_to_try = [
            os.environ.get("GEMINI_MODEL"),  # env override first if set
            "gemini-3.8-flash",
            "gemini-2.5-flash",
            "gemini-2.0-flash-lite",
        ]
        models_to_try = [m for m in models_to_try if m]  # strip None

        self.model_name = None
        for model_name in models_to_try:
            try:
                # Probe with a 1-token generation to confirm availability
                probe = self.client.interactions.create(
                    model=model_name,
                    input="hi",
                )
                if probe and probe.output_text:
                    self.model_name = model_name
                    logger.info(f"✅ Using Gemini model: {model_name}")
                    print(f"✅ Using Gemini model: {model_name}")
                    break
            except Exception as e:
                logger.warning(f"Model {model_name} failed: {e}")
                print(f"⚠️ Model {model_name} not available: {e}")
                continue

        if not self.model_name:
            raise Exception("No Gemini models available. Please check your API key.")

    def get_streaming_response(self, messages, temperature=0.7, max_tokens=2048, top_p=0.9):
        """Get streaming response from Gemini via the Interactions API."""
        try:
            # ---- Build the input ----
            system_prompt = ""
            history = []

            for msg in messages:
                role = msg.get("role")
                content = msg.get("content", "")
                if role == "system":
                    system_prompt = content
                elif role == "user":
                    history.append({
                        "type": "user_input",
                        "content": [{"type": "text", "text": content}],
                    })
                elif role == "assistant":
                    # Model output steps are appended verbatim when store=False,
                    # but for a simple chat we can pass prior turns as text.
                    history.append({
                        "type": "model_output",
                        "content": [{"type": "text", "text": content}],
                    })

            # ---- Stream ----
            stream = self.client.interactions.create(
                model=self.model_name,
                input=history,
                system_instruction=system_prompt or None,
                stream=True,
                generation_config={
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                    "top_p": top_p,
                },
            )

            chunk_count = 0
            for event in stream:
                # SSE events have a `delta.text` on step.delta frames
                delta = getattr(event, "delta", None)
                text = getattr(delta, "text", None) if delta else None
                if text:
                    chunk_count += 1
                    yield text

            print(f"✅ Generated {chunk_count} chunks from Gemini")

            if chunk_count == 0:
                raise Exception("Gemini returned empty response")

        except Exception as e:
            print(f"❌ Gemini error: {e}")
            raise Exception(f"Gemini API error: {str(e)}")
