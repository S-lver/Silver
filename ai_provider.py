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

        # Pick the model up front — no probing.
        # A startup probe adds latency and can take the whole app down
        # over a transient 503. Let errors surface at request time instead.
        self.model_name = os.environ.get("GEMINI_MODEL") or "gemini-3.8-flash"

        logger.info(f"✅ AI Provider initialized, model: {self.model_name}")
        print(f"✅ Using Gemini model: {self.model_name}")

    def get_streaming_response(
        self,
        messages,
        temperature=0.7,
        max_tokens=2048,
        top_p=0.9,
    ):
        """Stream a response from Gemini via the Interactions API."""
        try:
            # ---- Build the conversation input ----
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
                    history.append({
                        "type": "model_output",
                        "content": [{"type": "text", "text": content}],
                    })

            print(
                f"📝 Prompt length: {len(history)} turns, "
                f"using model: {self.model_name}"
            )

            # ---- Build request kwargs ----
            # Some google-genai versions accept generation_config directly,
            # others nest it inside `config`. Try the flat form first.
            request_kwargs = {
                "model": self.model_name,
                "input": history,
                "stream": True,
                "generation_config": {
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                    "top_p": top_p,
                },
            }
            if system_prompt:
                request_kwargs["system_instruction"] = system_prompt

            stream = self.client.interactions.create(**request_kwargs)

            chunk_count = 0
            for event in stream:
                # SSE events expose delta text on step.delta frames.
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
