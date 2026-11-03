from flask import Flask, request, jsonify
from flask_cors import CORS

import pandas as pd
import numpy as np
import joblib


# =========================================================
# FLASK APPLICATION
# =========================================================

app = Flask(__name__)
CORS(app)


# =========================================================
# LOAD MODEL
# =========================================================

MODEL_PATH = "models/improved_random_forest_glucose_model.pkl"
FEATURE_PATH = "models/feature_columns.pkl"

print("Loading Dia Decision AI model...")

model = joblib.load(MODEL_PATH)
feature_columns = joblib.load(FEATURE_PATH)

print("Model loaded successfully.")
print("Expected features:", len(feature_columns))


# =========================================================
# GLUCOSE STATUS
# =========================================================

def glucose_status(glucose):

    if glucose < 70:
        return "LOW"

    elif glucose < 140:
        return "NORMAL"

    elif glucose < 180:
        return "ELEVATED"

    else:
        return "HIGH"


# =========================================================
# GLUCOSE PREDICTION
# =========================================================

def predict_glucose(state):

    X = pd.DataFrame([state])

    X = X[feature_columns]

    prediction = model.predict(X)[0]

    return float(prediction)


# =========================================================
# LIFESTYLE ANALYSIS
# =========================================================

def analyze_lifestyle(data):

    observations = []
    recommendations = []

    meal_carbs = data["meal_carbs"]
    exercise_duration = data["exercise_duration"]
    sleep_duration = data["sleep_duration_hours"]
    sleep_quality = data["sleep_quality"]

    if meal_carbs >= 50:

        observations.append(
            "High carbohydrate intake detected."
        )

        recommendations.append(
            "Consider a lower-carbohydrate meal option."
        )


    if exercise_duration == 0:

        observations.append(
            "No exercise recorded."
        )

        recommendations.append(
            "Consider maintaining appropriate physical activity."
        )


    if sleep_duration < 6:

        observations.append(
            "Sleep duration is relatively short."
        )

        recommendations.append(
            "Consider maintaining adequate sleep."
        )


    if sleep_quality <= 2:

        observations.append(
            "Sleep quality is relatively low."
        )

        recommendations.append(
            "Consider improving sleep quality and maintaining a consistent sleep routine."
        )


    glucose_change = data["glucose_change_15min"]

    if glucose_change >= 15:

        observations.append(
            "Glucose is rising rapidly."
        )


    elif glucose_change <= -15:

        observations.append(
            "Glucose is falling rapidly."
        )


    if not observations:

        observations.append(
            "No major lifestyle concerns detected."
        )


    return observations, recommendations


# =========================================================
# DIGITAL TWIN
# =========================================================

def simulate_scenarios(state):

    current = state.copy()


    reduced_carbs = state.copy()

    reduced_carbs["meal_carbs"] = max(
        0,
        state["meal_carbs"] * 0.5
    )


    increased_exercise = state.copy()

    if state["exercise_duration"] > 0:

        increased_exercise["exercise_duration"] = (
            state["exercise_duration"] + 20
        )

    else:

        increased_exercise["exercise_duration"] = 20


    increased_exercise["exercise_intensity"] = max(
        state["exercise_intensity"],
        1
    )


    improved_sleep = state.copy()

    improved_sleep["sleep_duration_hours"] = max(
        state["sleep_duration_hours"],
        8
    )

    improved_sleep["sleep_quality"] = max(
        state["sleep_quality"],
        4
    )


    scenarios = {

        "Current Lifestyle": current,

        "Reduced Carbohydrates": reduced_carbs,

        "Increased Exercise": increased_exercise,

        "Improved Sleep": improved_sleep
    }


    results = []


    for name, scenario_state in scenarios.items():

        prediction = predict_glucose(
            scenario_state
        )

        results.append({

            "scenario": name,

            "predicted_glucose": round(
                prediction,
                2
            )
        })


    return results


# =========================================================
# DECISION ENGINE
# =========================================================

def choose_best_scenario(results):

    baseline = next(
        item["predicted_glucose"]
        for item in results
        if item["scenario"] == "Current Lifestyle"
    )


    alternatives = [

        item for item in results

        if item["scenario"] != "Current Lifestyle"
    ]


    for item in alternatives:

        item["improvement"] = round(
            baseline - item["predicted_glucose"],
            2
        )


    meaningful = [

        item for item in alternatives

        if item["improvement"] >= 2.0
    ]


    if meaningful:

        best = max(
            meaningful,
            key=lambda x: x["improvement"]
        )

        return {

            "best_scenario":
                best["scenario"],

            "best_prediction":
                best["predicted_glucose"],

            "improvement":
                best["improvement"],

            "decision":
                f"Consider the {best['scenario'].lower()} "
                "scenario as a simulated lifestyle option."
        }


    return {

        "best_scenario":
            "Current Lifestyle",

        "best_prediction":
            baseline,

        "improvement":
            0,

        "decision":
            "No scenario produced a meaningful simulated improvement. "
            "Maintain current lifestyle state."
    }


# =========================================================
# API ROUTE
# =========================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()


        # -------------------------------------------------
        # Convert input to model state
        # -------------------------------------------------

        state = {

            "glucose_value":
                float(data["glucose_value"]),

            "glucose_lag_1":
                float(data["glucose_lag_1"]),

            "glucose_lag_2":
                float(data["glucose_lag_2"]),

            "glucose_lag_3":
                float(data["glucose_lag_3"]),

            "glucose_lag_6":
                float(data["glucose_lag_6"]),

            "glucose_change_5min":
                float(data["glucose_change_5min"]),

            "glucose_change_15min":
                float(data["glucose_change_15min"]),

            "meal_carbs":
                float(data["meal_carbs"]),

            "bolus_dose":
                float(data["bolus_dose"]),

            "basal_value":
                float(data["basal_value"]),

            "temp_basal_value":
                float(data["temp_basal_value"]),

            "exercise_duration":
                float(data["exercise_duration"]),

            "exercise_intensity":
                float(data["exercise_intensity"]),

            "sleep_duration_hours":
                float(data["sleep_duration_hours"]),

            "sleep_quality":
                float(data["sleep_quality"]),

            "finger_stick_value":
                float(data["finger_stick_value"]),

            "hour":
                int(data["hour"]),

            "day_of_week":
                int(data["day_of_week"])
        }


        # -------------------------------------------------
        # Prediction
        # -------------------------------------------------

        prediction = predict_glucose(
            state
        )


        status = glucose_status(
            prediction
        )


        # -------------------------------------------------
        # Lifestyle analysis
        # -------------------------------------------------

        observations, recommendations = (
            analyze_lifestyle(state)
        )


        # -------------------------------------------------
        # Digital Twin
        # -------------------------------------------------

        scenarios = simulate_scenarios(
            state
        )


        # -------------------------------------------------
        # Decision
        # -------------------------------------------------

        decision = choose_best_scenario(
            scenarios
        )


        # -------------------------------------------------
        # Final response
        # -------------------------------------------------

        response = {

            "current_glucose":
                state["glucose_value"],

            "predicted_glucose_30min":
                round(prediction, 2),

            "glucose_status":
                status,

            "observations":
                observations,

            "recommendations":
                recommendations,

            "scenarios":
                scenarios,

            "best_scenario":
                decision["best_scenario"],

            "best_scenario_prediction":
                decision["best_prediction"],

            "simulated_improvement":
                decision["improvement"],

            "decision":
                decision["decision"]
        }


        return jsonify(response)


    except Exception as e:

        return jsonify({

            "error": str(e)

        }), 400


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({

        "application":
            "Dia Decision AI",

        "status":
            "Backend running successfully",

        "service":
            "30-minute glucose prediction and digital twin simulation"
    })


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    app.run(

       host="127.0.0.1",

        port=5000,

        debug=True
    )