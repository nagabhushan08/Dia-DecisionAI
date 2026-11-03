const API_URL = "http://127.0.0.1:5000/predict";

const $ = (id) => document.getElementById(id);

$("analyzeBtn").addEventListener("click", analyzePatient);

async function analyzePatient() {

    const button = $("analyzeBtn");

    button.disabled = true;
    button.innerHTML = "ANALYZING...";

    try {

        const glucose = Number($("glucose_value").value);
        const lag1 = Number($("glucose_lag_1").value);
        const lag2 = Number($("glucose_lag_2").value);
        const lag3 = Number($("glucose_lag_3").value);
        const lag6 = Number($("glucose_lag_6").value);

        const data = {

            glucose_value: glucose,

            glucose_lag_1: lag1,
            glucose_lag_2: lag2,
            glucose_lag_3: lag3,
            glucose_lag_6: lag6,

            glucose_change_5min: glucose - lag1,

            glucose_change_15min: glucose - lag3,

            meal_carbs: Number($("meal_carbs").value),

            bolus_dose: Number($("bolus_dose").value),

            basal_value: Number($("basal_value").value),

            temp_basal_value: 0,

            exercise_duration:
                Number($("exercise_duration").value),

            exercise_intensity:
                Number($("exercise_intensity").value),

            sleep_duration_hours:
                Number($("sleep_duration_hours").value),

            sleep_quality:
                Number($("sleep_quality").value),

            finger_stick_value:
                Number($("finger_stick_value").value),

            hour: new Date().getHours(),

            day_of_week: new Date().getDay()
        };


        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        });


        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }


        const result = await response.json();

        updateDashboard(result);

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to Dia Decision AI backend.\n\n" +
            "Make sure Flask is running on port 5000."
        );

    } finally {

        button.disabled = false;

        button.innerHTML =
            'ANALYZE PATIENT <span>→</span>';
    }
}


function updateDashboard(result) {

    /* ================= PREDICTION ================= */

    $("currentGlucose").textContent =
        Number(result.current_glucose).toFixed(2);

    $("predictedGlucose").textContent =
        Number(result.predicted_glucose_30min).toFixed(2);


    /* ================= STATUS ================= */

    const status =
        result.glucose_status.toLowerCase();

    const statusElement =
        $("glucoseStatus");

    statusElement.textContent =
        result.glucose_status;

    statusElement.className =
        "glucose-status " + status;


    /* ================= OBSERVATIONS ================= */

    const observations =
        $("observations");

    observations.innerHTML = "";

    if (
        result.observations &&
        result.observations.length > 0
    ) {

        result.observations.forEach(item => {

            const li = document.createElement("li");

            li.textContent = item;

            observations.appendChild(li);

        });

    } else {

        observations.innerHTML =
            "<li>No major lifestyle observations.</li>";
    }


    /* ================= RECOMMENDATIONS ================= */

    const recommendations =
        $("recommendations");

    recommendations.innerHTML = "";

    if (
        result.recommendations &&
        result.recommendations.length > 0
    ) {

        result.recommendations.forEach(item => {

            const li = document.createElement("li");

            li.textContent = item;

            recommendations.appendChild(li);

        });

    }


    /* ================= SCENARIOS ================= */

    if (result.scenarios) {

        result.scenarios.forEach(scenario => {

            const value =
                Number(
                    scenario.predicted_glucose
                ).toFixed(2);


            if (
                scenario.scenario ===
                "Current Lifestyle"
            ) {

                $("currentScenario").textContent =
                    value;

            }

            else if (
                scenario.scenario ===
                "Reduced Carbohydrates"
            ) {

                $("carbScenario").textContent =
                    value;

            }

            else if (
                scenario.scenario ===
                "Increased Exercise"
            ) {

                $("exerciseScenario").textContent =
                    value;

            }

            else if (
                scenario.scenario ===
                "Improved Sleep"
            ) {

                $("sleepScenario").textContent =
                    value;

            }

        });

    }


    /* ================= BEST SCENARIO ================= */

    $("bestScenario").textContent =
        result.best_scenario;


    $("improvement").textContent =
        Number(result.simulated_improvement)
            .toFixed(2) + " mg/dL";


    $("decision").textContent =
        result.decision;
}