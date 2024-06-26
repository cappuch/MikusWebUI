from llama_cpp import Llama
from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
import yaml

with open('config.yaml', 'r') as file:
    config_data = yaml.safe_load(file)

model_id = config_data['configs']['model_id']
model_regex = config_data['configs']['regex']

#lol hacky implementation for the colab-detection
def in_colab():
    try:
        import google.colab
        return True
    except ImportError:
        return False

app = Flask(__name__)
CORS(app)
if in_colab():
    from flask_ngrok3 import run_with_ngrok
    run_with_ngrok(app)
else:
    pass


fasterllm = Llama.from_pretrained(
    repo_id=model_id,
    filename=model_regex,
    verbose=True
)


@app.route('/chat', methods=['POST'])
def infer():
    data = request.json
    
    if isinstance(data, list):
        messages = data
    else:
        messages = data.get('messages', [])

    for msg in messages:
        if msg.get('role') == 'system':
            msg['content'] = "You are a helpful assistant."

    if data.get('temperature'):
        response = fasterllm.create_chat_completion(messages=messages, temperature=data.get('temperature'))
    else:
        response = fasterllm.create_chat_completion(messages=messages, temperature=0.2)
    simplified_response = {
        "created": response.get("created"),
        "usage": response.get("usage"),
        "content": [choice["message"]["content"] for choice in response.get("choices", [])],
    }
    
    return jsonify(simplified_response)

@app.route('/')
def index():
    return render_template(
        'index.html',
        bot=model_id,
        temp=0.2
    )

@app.route('/style.css')
def style():
    return send_file('templates/style.css')

@app.route('/script.js')
def script():
    return send_file('templates/script.js')


if __name__ == '__main__':
    app.run("0.0.0.0", port=4000)
