import requests

from config.settings import (
    GENERATE_URL,
    TAGS_URL,
    DEFAULT_MODEL
)


class OllamaService:

    def generate(self, prompt, model=None):

        payload = {
            "model": model or DEFAULT_MODEL,
            "prompt": prompt[:1500],
            "stream": False,
            "think": False,
            "options": {
                "num_ctx": 1024
            }
        }

        response = requests.post(
            GENERATE_URL,
            json=payload,
            timeout=300
        )

        print("\n===== STATUS =====")
        print(response.status_code)

        print("\n===== RESPONSE =====")
        print(response.text)

        response.raise_for_status()

        data = response.json()

        return data["response"]

    def models(self):

        response = requests.get(
            TAGS_URL
        )

        response.raise_for_status()

        data = response.json()

        return data["models"]