import os
import joblib
import pandas as pd


# ============================================================
# PATHS
# ============================================================

MODEL_PATH = "models/improved_random_forest_glucose_model.pkl"
FEATURE_PATH = "models/feature_columns.pkl"


# ============================================================
# LOAD MODEL
# ============================================================

print("Loading glucose prediction model...")

model = joblib.load(MODEL_PATH)
feature_columns = joblib.load(FEATURE_PATH)

print("Model loaded successfully.")
print("Number of expected features:", len(feature_columns))


# ============================================================
# GLUCOSE CATEGORY
# ============================================================

def glucose_category(glucose):
    if glucose < 70:
        return "LOW"
    elif glucose < 140:
        return "NORMAL"
    elif glucose < 180:
        return "ELEVATED"
    else:
        return "HIGH"


# ============================================================
# GET USER INPUT
# ============================================================

print("\n" + "=" * 55)
print("       30-MINUTE GLUCOSE PREDICTION SYSTEM")
print("=" * 55)

print("\nEnter the patient's current information.\n")


glucose_value = float(
    input("Current glucose (mg/dL): ")
)

glucose_lag_1 = float(
    input("Glucose 5 minutes ago (mg/dL): ")
)

glucose_lag_2 = float(
    input("Glucose 10 minutes ago (mg/dL): ")
)

glucose_lag_3 = float(
    input("Glucose 15 minutes ago (mg/dL): ")
)

glucose_lag_6 = float(
    input("Glucose 30 minutes ago (mg/dL): ")
)


# ============================================================
# CALCULATE GLUCOSE TRENDS
# ============================================================

glucose_change_5min = (
    glucose_value - glucose_lag_1
)

glucose_change_15min = (
    glucose_value - glucose_lag_3
)


# ============================================================
# OTHER INPUTS
# ============================================================

meal_carbs = float(
    input("Meal carbohydrates (grams): ")
)

bolus_dose = float(
    input("Bolus insulin dose: ")
)

basal_value = float(
    input("Basal insulin value: ")
)

temp_basal_value = float(
    input("Temporary basal value: ")
)

exercise_duration = float(
    input("Exercise duration (minutes): ")
)

exercise_intensity = float(
    input("Exercise intensity: ")
)

sleep_duration_hours = float(
    input("Sleep duration (hours): ")
)

sleep_quality = float(
    input("Sleep quality: ")
)

finger_stick_value = float(
    input("Finger-stick glucose (mg/dL): ")
)


# ============================================================
# TIME INPUT
# ============================================================

timestamp_input = input(
    "Current timestamp (YYYY-MM-DD HH:MM:SS): "
)

timestamp = pd.to_datetime(
    timestamp_input
)

hour = timestamp.hour
day_of_week = timestamp.dayofweek


# ============================================================
# CREATE FEATURE DATAFRAME
# ============================================================

input_data = {

    "glucose_value":
        glucose_value,

    "glucose_lag_1":
        glucose_lag_1,

    "glucose_lag_2":
        glucose_lag_2,

    "glucose_lag_3":
        glucose_lag_3,

    "glucose_lag_6":
        glucose_lag_6,

    "glucose_change_5min":
        glucose_change_5min,

    "glucose_change_15min":
        glucose_change_15min,

    "meal_carbs":
        meal_carbs,

    "bolus_dose":
        bolus_dose,

    "basal_value":
        basal_value,

    "temp_basal_value":
        temp_basal_value,

    "exercise_duration":
        exercise_duration,

    "exercise_intensity":
        exercise_intensity,

    "sleep_duration_hours":
        sleep_duration_hours,

    "sleep_quality":
        sleep_quality,

    "finger_stick_value":
        finger_stick_value,

    "hour":
        hour,

    "day_of_week":
        day_of_week
}


input_df = pd.DataFrame(
    [input_data]
)


# ============================================================
# ENSURE CORRECT FEATURE ORDER
# ============================================================

input_df = input_df[
    feature_columns
]


# ============================================================
# PREDICTION
# ============================================================

prediction = model.predict(
    input_df
)[0]


# ============================================================
# RESULT
# ============================================================

category = glucose_category(
    prediction
)


print("\n" + "=" * 55)
print("              PREDICTION RESULT")
print("=" * 55)

print(
    f"\nCurrent glucose       : "
    f"{glucose_value:.2f} mg/dL"
)

print(
    f"Predicted glucose     : "
    f"{prediction:.2f} mg/dL"
)

print(
    "\nPrediction horizon    : "
    "Approximately 30 minutes"
)

print(
    f"Predicted category    : "
    f"{category}"
)

print("\n" + "=" * 55)
print("Prediction completed successfully.")
print("=" * 55)