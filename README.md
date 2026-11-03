# 🩺 Dia Decision AI – Glucose Intelligence & Prediction

**Dia Decision AI** is an AI-powered glucose prediction and decision-support system designed to forecast blood glucose levels over the next 30 minutes and explore how different lifestyle conditions may influence glucose behavior.

The system uses Machine Learning to analyze glucose readings, insulin information, dietary intake, physical activity, sleep, and other health-related inputs to generate predictions and compare different lifestyle scenarios.

## 🚀 Project Overview

Managing glucose levels involves understanding how multiple factors influence blood glucose.

Dia Decision AI aims to make this process easier by providing:

- 30-minute blood glucose prediction.
- Machine Learning-based glucose forecasting.
- Lifestyle scenario simulation.
- Comparison of different health conditions.
- Identification of the scenario with the lowest predicted glucose.
- Interactive glucose intelligence dashboard.

## ✨ Key Features

### 1. Glucose Prediction
- Accepts current and previous glucose readings.
- Analyzes glucose trends and changes.
- Predicts glucose levels for the next 30 minutes.

### 2. Insulin Profile
Users can provide:
- Bolus insulin (units).
- Basal insulin (units).
- Temporary basal insulin (units).

### 3. Lifestyle Inputs
The system considers different lifestyle parameters:

- Carbohydrate intake.
- Exercise duration.
- Exercise intensity.
- Sleep duration.
- Sleep quality.
- Glucose readings and trends.

### 4. AI-Based Lifestyle Simulation

The system evaluates four different lifestyle scenarios:

- State 1 – Baseline condition.
- State 2 – Improved physical activity.
- State 3 – Improved lifestyle condition.
- State 4 – Improved sleep condition.

Each scenario generates a predicted glucose value, allowing users to compare the possible outcomes.

### 5. Best Scenario Selection

The backend compares the predicted glucose values from all four scenarios.

The current decision logic identifies the scenario with the lowest predicted glucose value.

**Note:** The lowest predicted glucose is not necessarily the medically safest outcome. This project is an experimental decision-support system and does not replace professional medical advice.

## 🔄 Project Workflow

1. User enters glucose information.
2. User provides insulin profile details.
3. User enters lifestyle information.
4. Input features are prepared for the ML model.
5. The trained Random Forest model processes the input.
6. The system generates a 30-minute glucose prediction.
7. Four lifestyle scenarios are evaluated.
8. Predicted glucose values are compared.
9. The dashboard displays the predictions and scenario comparison.

## 🧠 Machine Learning

The project uses a **Random Forest Regression model** for glucose prediction.

### Model Information
- Algorithm: Random Forest Regression.
- Input features: 18.
- Prediction: Future blood glucose level.
- Prediction horizon: 30 minutes.
- Model format: Pickle (`.pkl`).

### Model Files
- `improved_random_forest_glucose_model.pkl`
- `random_forest_glucose_model.pkl`
- `feature_columns.pkl`

## 🛠️ Technologies Used

| Component | Technology |
|---|---|
| Frontend | React.js |
| Backend | Python Flask |
| Machine Learning | Scikit-learn |
| ML Algorithm | Random Forest |
| Data Processing | Pandas, NumPy |
| API Communication | REST API |
| Model Storage | Pickle |
| Version Control | Git & GitHub |
| Large File Storage | Git LFS |

## 📁 Project Structure

```text
DiaDecisionAI/
│
├── data/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── models/
│   ├── improved_random_forest_glucose_model.pkl
│   ├── random_forest_glucose_model.pkl
│   └── feature_columns.pkl
│
├── notebooks/
│
├── src/
│   └── Flask backend files
│
├── requirement.txt
├── README.md
└── .gitignore
```

## ⚙️ Installation and Setup

### Prerequisites

- Python 3.x
- Node.js and npm
- Git
- Git LFS

### 1. Clone the Repository

```bash
git clone https://github.com/nagabhushan08/Dia-DecisionAI.git
cd Dia-DecisionAI
```

### 2. Download Machine Learning Models

```bash
git lfs install
git lfs pull
```

### 3. Set Up the Backend

Create and activate a virtual environment:

```bash
python -m venv venv
```

For macOS/Linux:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirement.txt
```

Start the Flask backend using the appropriate backend entry-point file:

```bash
python app.py
```

The backend runs at:

`http://127.0.0.1:5000`

### 4. Set Up the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🔗 API Endpoint

**Prediction API**

```http
POST /predict
```

The frontend sends the glucose, insulin, and lifestyle information to the Flask backend.

The backend processes the input using the trained Machine Learning model and returns the prediction.

## 🔮 Future Enhancements

- Improved glucose prediction accuracy.
- More advanced lifestyle simulations.
- Real-time glucose monitoring integration.
- Enhanced prediction visualizations.
- Personalized glucose trend analysis.
- Improved decision-support logic.
- Integration with wearable health devices.

## 🎯 Project Objective

The main objective of Dia Decision AI is to demonstrate how Artificial Intelligence and Machine Learning can be applied to glucose forecasting and lifestyle scenario analysis.

By combining glucose data, insulin information, and lifestyle factors, the project aims to provide an interactive way to understand possible changes in future glucose levels.

## 👨‍💻 Developer

**Nagabhushan K M**

Information Science and Engineering

GitHub: [@nagabhushan08](https://github.com/nagabhushan08)

---

*Disclaimer: Dia Decision AI is an academic and experimental project. Its predictions are not medical diagnoses or treatment recommendations. Never use its outputs to independently change insulin doses or other medical treatment.*
