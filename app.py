import os
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import speech_recognition as sr
from gtts import gTTS
import uuid

# Load API key
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)

# Route: Homepage
@app.route("/")
def home():
    return render_template("index.html")

# Route: Chat (text)
@app.route("/chat", methods=["POST"])
def chat():
    user_msg = request.json.get("message")
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(user_msg)
    return jsonify({"response": response.text})

# Route: Voice input
@app.route("/voice", methods=["POST"])
def voice():
    recognizer = sr.Recognizer()
    audio_file = request.files["audio"]
    with sr.AudioFile(audio_file) as source:
        audio_data = recognizer.record(source)
        user_msg = recognizer.recognize_google(audio_data)

    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(user_msg)

    # Convert text to speech
    tts = gTTS(response.text)
    file_name = f"static/{uuid.uuid4()}.mp3"
    tts.save(file_name)

    return jsonify({"response": response.text, "audio": file_name})

if __name__ == "__main__":
    app.run(debug=True)
