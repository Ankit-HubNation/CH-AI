import json
import requests

from config.settings import GENERATE_URL, DEFAULT_MODEL


class StreamService:

    def stream(self, prompt: str, model: str | None = None):

        payload = {
            "model": model or DEFAULT_MODEL,
            "prompt": prompt,
            "stream": True
        }

        response = requests.post(
            GENERATE_URL,
            json=payload,
            stream=True,
            timeout=300
        )

        response.raise_for_status()

        for line in response.iter_lines():

            if not line:
                continue

            data = json.loads(line.decode("utf-8"))

            if "response" in data:
                yield data["response"]

            if data.get("done"):
                break