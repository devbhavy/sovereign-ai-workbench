import requests
from langchain_ollama import ChatOllama

OLLAMA_URL = "http://localhost:11434"


class ModelManager:

    def __init__(self) -> None:
        self.current_model = None
    
    def unload(self,model_name : str):
        """unload a model from ollama memory"""

        requests.post(
            f"{OLLAMA_URL}/api/generate",json={
                "model" : model_name,
                "keep_alive" : 0
            }
        )
        print(f"Unloaded: {model_name}")

    def switch_to(self,model_name:str):
        if self.current_model == model_name:
            return

        
        if self.current_model:
            self.unload(self.current_model)

        self.current_model = model_name

        print(f"Switched to: {model_name}")

    def reasoning(self,think:bool=True, num_predict : int = 2048):

        self.switch_to("qwen3:8b")

        return ChatOllama(
            model="qwen3:8b",
            temperature=0,
            reasoning=think,
            num_predict=num_predict
        )

    def vision(self):

        self.switch_to("qwen3-vl:8b")

        return ChatOllama(
            model="qwen3-vl:8b",
            temperature=0
        )
