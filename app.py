"""Local web demo for the menu translator."""

from flask import Flask, jsonify, render_template, request

from menu_translator import MOCK_RESTAURANTS, MenuTranslationError, generate_menu_insight, is_mock_mode, translate_menu, translate_request


def create_app() -> Flask:
    app = Flask(__name__)

    @app.get("/")
    def index():
        return render_template("index.html")

    @app.get("/api/restaurants")
    def restaurants():
        return jsonify({"restaurants": MOCK_RESTAURANTS, "mode": "mock" if is_mock_mode() else "openai"})

    @app.get("/api/translate")
    def translate():
        menu = request.args.get("menu", "")
        try:
            result = translate_menu(menu)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        except MenuTranslationError as exc:
            return jsonify({"error": str(exc)}), 502
        return jsonify(result.model_dump())

    @app.get("/api/insight")
    def insight():
        menu = request.args.get("menu", "")
        language = request.args.get("language", "en")
        try:
            result = generate_menu_insight(menu, language)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        except MenuTranslationError as exc:
            return jsonify({"error": str(exc)}), 502
        return jsonify(result.model_dump())

    @app.post("/api/request-translate")
    def request_translate():
        payload = request.get_json(silent=True) or {}
        try:
            result = translate_request(payload.get("text", ""), payload.get("source_language", "zh"), payload.get("target_language", "ko"))
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        except MenuTranslationError as exc:
            return jsonify({"error": str(exc)}), 502
        return jsonify(result.model_dump())

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
