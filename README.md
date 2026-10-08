# 🌦️ WaetherCast AI - Intelligent Weather Classification & Prediction System

A full-stack Machine Learning web application that predicts meteorological weather conditions (**Sunny**, **Rainy**, **Cloudy**, **Snowy**) based on environmental and atmospheric parameters. Built with **Scikit-Learn (Random Forest)**, **Flask**, and a modern **Glassmorphism Web Dashboard**.

---

## 🚀 Features

- **High-Accuracy ML Model:** Powered by a Random Forest Classifier achieving **~92% Accuracy** on weather classification.
- **Glassmorphic Web Dashboard:** Responsive dark-mode interface with ambient gradient lighting, real-time slider value synchronization, and animated weather icons.
- **1-Click Test Scenarios:** Pre-configured scenarios (**Sunny Beach**, **Monsoon Storm**, **Alpine Blizzard**, **Overcast Autumn**) for instant testing.
- **Dynamic Accent Themes:** Ambient glows and result badges shift dynamically based on the predicted weather condition.
- **Comprehensive Analysis:** Displays prediction confidence percentage, per-class probability breakdown, and outdoor meteorological advisories.
- **Auto-Healing Pipeline:** If `.pkl` model files are missing, the server automatically trains and serializes the model from the dataset on startup in seconds.

---

## 🛠️ Tech Stack

- **Backend:** Python, Flask
- **Machine Learning:** Scikit-Learn, Pandas, NumPy, Joblib
- **Frontend:** Vanilla HTML5, CSS3 (Glassmorphism, CSS Grid, Flexbox), JavaScript (Fetch API)
- **Deployment-Ready:** Gunicorn WSGI support included

---

## 📁 Project Structure

```
Wether_pred/
│
├── app.py                            # Flask application & prediction backend
├── requirements.txt                  # Python production dependencies
├── .gitignore                        # Git ignore file
├── README.md                         # Project documentation
│
├── Weather_Classification_Data.csv   # Historical meteorological dataset
├── Weather_Prediction.ipynb          # Jupyter Notebook for EDA & model training
│
├── templates/
│   └── index.html                    # Glassmorphism frontend UI
│
└── static/
    ├── css/
    │   └── style.css                 # Custom glassmorphic styles & animations
    └── js/
        └── main.js                   # Asynchronous prediction & UI controller
```

---

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/weather-prediction.git
cd weather-prediction
```

### 2. Create and Activate Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
python app.py
```

Open your browser and navigate to: **`http://127.0.0.1:5000`**

---

## 📊 Model Evaluation Summary

| Model | Accuracy | Weighted F1-Score |
| :--- | :---: | :---: |
| **Random Forest Classifier** | **92.4%** | **0.92** |
| Decision Tree Classifier | 91.0% | 0.91 |
| K-Nearest Neighbors (KNN) | 89.5% | 0.90 |
| Logistic Regression | 87.0% | 0.87 |
| Gaussian Naive Bayes | 78.6% | 0.79 |

---