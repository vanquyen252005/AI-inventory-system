import unittest
from unittest.mock import patch, mock_open, MagicMock
import json
import os
import sys
from main import get_media_type, process_media

class TestMain(unittest.TestCase):

    def test_get_media_type_image(self):
        self.assertEqual(get_media_type("example.jpg"), "image")

    def test_get_media_type_video(self):
        self.assertEqual(get_media_type("example.mp4"), "video")

    def test_get_media_type_unknown(self):
        self.assertEqual(get_media_type("example.txt"), "unknown")

    @patch("builtins.print")
    @patch("sys.argv", ["main.py"])
    def test_process_media_missing_input(self, mock_print):
        process_media()
        mock_print.assert_called_once_with(json.dumps({"error": "Missing input path"}))

    @patch("builtins.print")
    @patch("sys.argv", ["main.py", "example.txt"])
    def test_process_media_unknown_file_type(self, mock_print):
        process_media()
        mock_print.assert_called_once_with(json.dumps({"error": "Unknown file type: example.txt"}))

    @patch("cv2.VideoCapture")
    @patch("builtins.print")
    @patch("sys.argv", ["main.py", "example.mp4"])
    def test_process_media_cannot_open_file(self, mock_print, mock_video_capture):
        mock_video_capture.return_value.isOpened.return_value = False
        process_media()
        mock_print.assert_called_once_with(json.dumps({"error": "Cannot open file: example.mp4"}))

if __name__ == "__main__":
    unittest.main()