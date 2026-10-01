import json
import os
import subprocess
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import menu_translator as mt
from pydantic import ValidationError
from app import create_app


class MenuTranslatorTests(unittest.TestCase):
    def test_mock_flag_never_calls_api(self):
        with patch.dict(os.environ, {"MOCK_LLM": "1", "OPENAI_API_KEY": "fake"}), patch("openai.OpenAI") as client:
            result = mt.translate_menu("제육볶음")
            client.assert_not_called()
        self.assertEqual(result.translations.zh.name, "辣炒猪肉")
        self.assertEqual(result.halal, "no")

    def test_missing_key_and_all_fixtures(self):
        with patch.dict(os.environ, {"MOCK_LLM": "0", "OPENAI_API_KEY": ""}), patch("openai.OpenAI") as client:
            for restaurant in mt.MOCK_RESTAURANTS:
                for menu in restaurant["menus"]:
                    result = mt.translate_menu(menu)
                    self.assertEqual(result.name_ko, menu)
                    self.assertEqual(set(result.model_dump()["translations"]), {"ko", "en", "zh"})
            client.assert_not_called()

    def test_unknown_menu_is_conservative_and_preserves_name(self):
        with patch.dict(os.environ, {"MOCK_LLM": "1"}):
            result = mt.translate_menu("  오늘의 특별 메뉴  ")
        self.assertEqual(result.name_ko, "오늘의 특별 메뉴")
        self.assertEqual((result.halal, result.vegan), ("unknown", "unknown"))
        self.assertEqual(result.ingredients, [])

    def test_mock_results_are_independent(self):
        with patch.dict(os.environ, {"MOCK_LLM": "1"}):
            mt.translate_menu("제육볶음").ingredients.clear()
            self.assertIn("pork", mt.translate_menu("제육볶음").ingredients)

    def test_rejects_empty_and_non_string_input(self):
        for value in ("", "   ", None, 123):
            with self.assertRaises(ValueError):
                mt.translate_menu(value)

    def test_schema_rejects_extra_language_invalid_flags_and_spice(self):
        with patch.dict(os.environ, {"MOCK_LLM": "1"}):
            data = mt.translate_menu("제육볶음").model_dump()
        for changes in ({"halal": "maybe"}, {"vegan": "maybe"}, {"spicy": 4}, {"spicy": True}):
            with self.assertRaises(ValidationError):
                mt.MenuTranslation.model_validate({**data, **changes})
        data["translations"]["ja"] = data["translations"]["en"]
        with self.assertRaises(ValidationError):
            mt.MenuTranslation.model_validate(data)

    def test_live_path_parses_and_handles_errors(self):
        with patch.dict(os.environ, {"MOCK_LLM": "1"}):
            expected = mt.translate_menu("제육볶음")
        with patch.dict(os.environ, {"MOCK_LLM": "0", "OPENAI_API_KEY": "fake"}), patch("openai.OpenAI") as factory:
            client = factory.return_value.__enter__.return_value
            client.responses.parse.return_value = SimpleNamespace(output_parsed=expected)
            self.assertEqual(mt.translate_menu("제육볶음"), expected)
            self.assertIs(client.responses.parse.call_args.kwargs["text_format"], mt.MenuTranslation)
            client.responses.parse.return_value = SimpleNamespace(output_parsed=None)
            with self.assertRaises(mt.MenuTranslationError):
                mt.translate_menu("제육볶음")
            client.responses.parse.side_effect = RuntimeError("simulated failure")
            with self.assertRaises(mt.MenuTranslationError):
                mt.translate_menu("제육볶음")

    def test_cli_outputs_readable_json(self):
        env = {**os.environ, "MOCK_LLM": "1"}
        proc = subprocess.run([sys.executable, "menu_translator.py", "김치찌개"], env=env, capture_output=True, text=True, check=True)
        self.assertEqual(json.loads(proc.stdout)["name_ko"], "김치찌개")
        self.assertIn("泡菜", proc.stdout)

    def test_flask_demo_routes_use_translator(self):
        app = create_app()
        app.config.update(TESTING=True)
        with patch.dict(os.environ, {"MOCK_LLM": "1", "OPENAI_API_KEY": ""}):
            client = app.test_client()
            page = client.get("/")
            self.assertEqual(page.status_code, 200)
            self.assertIn(b"Campus Menu Translator", page.data)
            restaurants = client.get("/api/restaurants")
            self.assertEqual(restaurants.status_code, 200)
            self.assertEqual(restaurants.get_json()["mode"], "mock")
            result = client.get("/api/translate?menu=%EC%A0%9C%EC%9C%A1%EB%B3%B6%EC%9D%8C")
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.get_json()["translations"]["en"]["name"], "Spicy Stir-fried Pork")
            request_result = client.post("/api/request-translate", json={"text": "少辣一点", "source_language": "zh", "target_language": "ko"})
            self.assertEqual(request_result.status_code, 200)
            self.assertEqual(request_result.get_json()["translated_text"], "덜 맵게 해주세요.")
            insight = client.get("/api/insight?menu=%EC%A0%9C%EC%9C%A1%EB%B3%B6%EC%9D%8C&language=zh")
            self.assertEqual(insight.status_code, 200)
            self.assertIn("韩式辣酱", insight.get_json()["notice"])
            korean_insight = client.get("/api/insight?menu=%EC%A0%9C%EC%9C%A1%EB%B3%B6%EC%9D%8C&language=ko")
            self.assertEqual(korean_insight.status_code, 200)
            self.assertIn("고추장", korean_insight.get_json()["notice"])
            self.assertEqual(client.get("/api/insight?menu=%EC%A0%9C%EC%9C%A1%EB%B3%B6%EC%9E%88%EC%9D%8C&language=ja").status_code, 400)
            invalid = client.get("/api/translate")
            self.assertEqual(invalid.status_code, 400)


if __name__ == "__main__":
    unittest.main()
