"""Streamlit 데모 화면.

실행: streamlit run frontend/app.py
"""
import os

import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="Hackathon Demo", page_icon="🚀", layout="wide")
st.title("🚀 Hackathon Demo")
st.caption("주제 확정 후 화면을 교체하세요")

tab_predict, tab_chat = st.tabs(["📈 Predict", "💬 Chat"])

with tab_predict:
    raw = st.text_input("Features (쉼표 구분)", "1.0, 2.0, 3.0")
    if st.button("예측"):
        features = [float(x) for x in raw.split(",") if x.strip()]
        r = requests.post(f"{BACKEND_URL}/predict", json={"features": features}, timeout=30)
        st.json(r.json())

with tab_chat:
    msg = st.text_area("질문")
    if st.button("보내기") and msg:
        with st.spinner("생각 중..."):
            r = requests.post(f"{BACKEND_URL}/chat", json={"message": msg}, timeout=300)
        if r.ok:
            st.markdown(r.json()["reply"])
        else:
            st.error(r.text)
