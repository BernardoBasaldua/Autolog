import os
import requests


class WhatsAppClient:
    def __init__(self):
        self.token = os.getenv("WHATSAPP_TOKEN")
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        self.api_version = os.getenv("WHATSAPP_API_VERSION", "v22.0")

        if not self.token or not self.phone_number_id:
            raise RuntimeError("Falta WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID")

    def send_template(self, to_number: str, template_name: str, variables: list[str]):
        url = f"https://graph.facebook.com/{self.api_version}/{self.phone_number_id}/messages"

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "en_US"},
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            #{"type": "text", "text": v} for v in variables
                        ],
                    }
                ],
            },
        }

        r = requests.post(url, headers=headers, json=payload, timeout=20)
        return r.status_code, r.text