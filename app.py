import os
import joblib
import pandas as pd
import numpy as np
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load models and encoders
MODEL_PATH = os.path.join(BASE_DIR, "weather_random_forest_model.pkl")
ONEHOT_PATH = os.path.join(BASE_DIR, "weather_onehot_encoder.pkl")
LABEL_PATH = os.path.join(BASE_DIR, "weather_label_encoder.pkl")

model = None
onehot_encoder = None
label_encoder = None

CAT_COLS = ['Cloud Cover', 'Season', 'Location']
NUM_COLS = [
    'Temperature', 
    'Humidity', 
    'Wind Speed', 
    'Precipitation (%)', 
    'Atmospheric Pressure', 
    'UV Index', 
    'Visibility (km)'
]

def train_and_save_artifacts():
    global model, onehot_encoder, label_encoder
    csv_candidates = [
        os.path.join(BASE_DIR, "Weather_Classification_Data.csv"),
        os.path.join(BASE_DIR, "weather_classification_data.csv")
    ]
    csv_path = next((p for p in csv_candidates if os.path.exists(p)), None)
    if not csv_path:
        print("Weather dataset CSV not found.")
        return

    print(f"Auto-training Random Forest model from {os.path.basename(csv_path)}...")
    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()

    X = df.drop('Weather Type', axis=1)
    y = df['Weather Type']

    from sklearn.preprocessing import OneHotEncoder, LabelEncoder
    from sklearn.ensemble import RandomForestClassifier

    onehot_encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    X_cat = onehot_encoder.fit_transform(X[CAT_COLS])
    X_cat_df = pd.DataFrame(X_cat, columns=onehot_encoder.get_feature_names_out(CAT_COLS), index=X.index)
    X_proc = pd.concat([X.drop(CAT_COLS, axis=1), X_cat_df], axis=1)

    label_encoder = LabelEncoder()
    y_enc = label_encoder.fit_transform(y)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_proc, y_enc)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(onehot_encoder, ONEHOT_PATH)
    joblib.dump(label_encoder, LABEL_PATH)
    print("✓ Model and encoders trained & saved successfully to .pkl files.")

def load_artifacts():
    global model, onehot_encoder, label_encoder
    if os.path.exists(MODEL_PATH) and os.path.exists(ONEHOT_PATH) and os.path.exists(LABEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            onehot_encoder = joblib.load(ONEHOT_PATH)
            label_encoder = joblib.load(LABEL_PATH)
            print("✓ Model and encoders loaded successfully from disk.")
            return
        except Exception as e:
            print(f"Error loading existing artifacts: {e}, will re-train.")
    
    train_and_save_artifacts()

load_artifacts()

WEATHER_INSIGHTS = {
    'Sunny': {
        'icon': 'sun',
        'badge_class': 'badge-sunny',
        'tagline': 'Clear skies with abundant sunshine.',
        'advice': 'Great day for outdoor activities. Apply sunscreen and stay hydrated.',
        'accent_color': '#f59e0b'
    },
    'Rainy': {
        'icon': 'cloud-rain',
        'badge_class': 'badge-rainy',
        'tagline': 'Precipitation expected with wet conditions.',
        'advice': 'Carry an umbrella or raincoat. Drive carefully on slippery roads.',
        'accent_color': '#3b82f6'
    },
    'Cloudy': {
        'icon': 'cloud',
        'badge_class': 'badge-cloudy',
        'tagline': 'Overcast or mostly covered skies.',
        'advice': 'Mild weather, suitable for a walk or outdoor sports.',
        'accent_color': '#64748b'
    },
    'Snowy': {
        'icon': 'snowflake',
        'badge_class': 'badge-snowy',
        'tagline': 'Cold temperatures with snowfall.',
        'advice': 'Dress warmly in layers. Watch for icy surfaces and freezing conditions.',
        'accent_color': '#06b6d4'
    }
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if model is None or onehot_encoder is None or label_encoder is None:
        return jsonify({
            'success': False,
            'error': 'Model or encoders not loaded. Please ensure .pkl files exist.'
        }), 500

    try:
        data = request.get_json() if request.is_json else request.form

        # Extract features
        temp = float(data.get('temperature', 25.0))
        humidity = float(data.get('humidity', 60.0))
        wind_speed = float(data.get('wind_speed', 10.0))
        precipitation = float(data.get('precipitation', 20.0))
        pressure = float(data.get('pressure', 1013.0))
        uv_index = float(data.get('uv_index', 5.0))
        visibility = float(data.get('visibility', 10.0))

        cloud_cover = str(data.get('cloud_cover', 'partly cloudy')).strip()
        season = str(data.get('season', 'Summer')).strip()
        location = str(data.get('location', 'inland')).strip()

        # Build raw dataframe
        input_dict = {
            'Temperature': [temp],
            'Humidity': [humidity],
            'Wind Speed': [wind_speed],
            'Precipitation (%)': [precipitation],
            'Cloud Cover': [cloud_cover],
            'Atmospheric Pressure': [pressure],
            'UV Index': [uv_index],
            'Season': [season],
            'Visibility (km)': [visibility],
            'Location': [location]
        }
        input_df = pd.DataFrame(input_dict)

        # One-Hot Encode categorical columns
        cat_encoded = onehot_encoder.transform(input_df[CAT_COLS])
        cat_encoded_df = pd.DataFrame(
            cat_encoded,
            columns=onehot_encoder.get_feature_names_out(CAT_COLS),
            index=input_df.index
        )

        # Merge with numerical columns
        features_df = input_df.drop(CAT_COLS, axis=1)
        features_df = pd.concat([features_df, cat_encoded_df], axis=1)

        # Predict
        pred_encoded = model.predict(features_df)[0]
        pred_label = label_encoder.inverse_transform([pred_encoded])[0]

        # Calculate prediction probabilities if supported
        probabilities = {}
        confidence = 90.0
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(features_df)[0]
            classes = label_encoder.classes_
            for cls, p in zip(classes, proba):
                probabilities[cls] = round(float(p) * 100, 1)
            confidence = probabilities.get(pred_label, round(float(np.max(proba)) * 100, 1))

        details = WEATHER_INSIGHTS.get(pred_label, {
            'icon': 'cloud-sun',
            'badge_class': 'badge-default',
            'tagline': f'{pred_label} weather predicted.',
            'advice': 'Check local forecasts before heading out.',
            'accent_color': '#6366f1'
        })

        return jsonify({
            'success': True,
            'prediction': pred_label,
            'confidence': confidence,
            'probabilities': probabilities,
            'insights': details,
            'input_summary': {
                'temperature': f"{temp} °C",
                'humidity': f"{humidity} %",
                'wind_speed': f"{wind_speed} km/h",
                'precipitation': f"{precipitation} %",
                'pressure': f"{pressure} hPa",
                'uv_index': uv_index,
                'visibility': f"{visibility} km",
                'cloud_cover': cloud_cover,
                'season': season,
                'location': location
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    print("Starting Weather Prediction Flask Server on http://127.0.0.1:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
