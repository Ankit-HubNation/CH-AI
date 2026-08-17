import requests

from config.settings import (
    GENERATE_URL,
    TAGS_URL,
    DEFAULT_MODEL
)


class OllamaService:

    def generate(self, prompt, model=None, cpu_mode=True):

        model = model or DEFAULT_MODEL
        
        print("\n===== OLLAMA REQUEST =====")
        print(f"Model: {model}")
        print(f"Mode: {'CPU' if cpu_mode else 'Default'}")

        options = {
            "num_ctx": 2048,
            "temperature": 0.7
        }

        if cpu_mode:
            options["num_gpu"] = 0

        payload = {
            "model": model,
            "prompt": prompt[:1500],
            "stream": False,
            "think": False,
            "options": options
        }

        try:
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
            text = data.get("response", "")

            if not text.strip():
                print("\n===== EMPTY OLLAMA RESPONSE =====")
                print(data)
                return "Ollama returned an empty response.", False

            return text, False
        except requests.exceptions.HTTPError as e:
            if response.status_code >= 400:
                err_text = response.text.lower()
                print("\n===== OLLAMA ERROR =====")
                print(err_text)
                if any(x in err_text for x in ["cudamalloc failed", "unable to allocate cuda", "out of memory", "llama-server process has terminated"]):
                    print("\n===== OLLAMA CRASH INTERCEPTED =====")
                    return "Model failed to load. CPU fallback enabled.", True
            return f"Ollama HTTP error: {response.status_code} {response.text}", True
        except requests.exceptions.RequestException as e:
            print("\n===== OLLAMA CONNECTION ERROR =====")
            print(str(e))
            return f"Could not connect to Ollama at {GENERATE_URL}: {e}", True
        except Exception as e:
            print("\n===== OLLAMA UNKNOWN ERROR =====")
            print(str(e))
            return f"Ollama error: {e}", True

    def models(self):

        response = requests.get(
            TAGS_URL,
            timeout=10
        )

        response.raise_for_status()

        data = response.json()

        return data.get("models", [])
