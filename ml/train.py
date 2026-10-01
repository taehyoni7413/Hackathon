"""학습 템플릿: 데이터 로드 → 전처리 → 학습 → 평가 → 저장.

실행: python ml/train.py --data data/train.csv --target label
"""
import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_absolute_error
from sklearn.model_selection import train_test_split

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True)
    parser.add_argument("--target", required=True)
    parser.add_argument("--task", choices=["clf", "reg"], default="clf")
    args = parser.parse_args()

    df = pd.read_csv(args.data).dropna()
    X = pd.get_dummies(df.drop(columns=[args.target]))
    y = df[args.target]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    if args.task == "clf":
        model = RandomForestClassifier(n_estimators=200, random_state=42)
        model.fit(X_train, y_train)
        print("accuracy:", accuracy_score(y_test, model.predict(X_test)))
    else:
        model = RandomForestRegressor(n_estimators=200, random_state=42)
        model.fit(X_train, y_train)
        print("MAE:", mean_absolute_error(y_test, model.predict(X_test)))

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump({"model": model, "columns": list(X.columns)}, MODEL_DIR / "model.joblib")
    print("saved:", MODEL_DIR / "model.joblib")


if __name__ == "__main__":
    main()
