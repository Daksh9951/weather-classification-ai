/**
 * AetherCast AI - Frontend Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('weather-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    const btnIcon = submitBtn.querySelector('.btn-icon');
    const btnText = submitBtn.querySelector('.btn-text');

    const resultPlaceholder = document.getElementById('result-placeholder');
    const resultContent = document.getElementById('result-content');

    const predictionBadge = document.getElementById('prediction-badge');
    const predictionConfidence = document.getElementById('prediction-confidence');
    const predictionHeadline = document.getElementById('prediction-headline');
    const predictionTagline = document.getElementById('prediction-tagline');
    const predictionAdvice = document.getElementById('prediction-advice');
    const weatherIconContainer = document.getElementById('weather-icon-container');
    const probBarsContainer = document.getElementById('prob-bars-container');
    const snapshotContainer = document.getElementById('snapshot-container');

    // Preset configurations
    const PRESETS = {
        sunny: {
            temperature: 35,
            humidity: 38,
            wind_speed: 6.5,
            precipitation: 5,
            pressure: 1019,
            uv_index: 9,
            visibility: 12,
            cloud_cover: 'clear',
            season: 'Summer',
            location: 'coastal'
        },
        rainy: {
            temperature: 17,
            humidity: 93,
            wind_speed: 18,
            precipitation: 85,
            pressure: 997,
            uv_index: 1,
            visibility: 3.5,
            cloud_cover: 'overcast',
            season: 'Winter',
            location: 'inland'
        },
        snowy: {
            temperature: -7,
            humidity: 86,
            wind_speed: 24,
            precipitation: 78,
            pressure: 1003,
            uv_index: 1,
            visibility: 1.5,
            cloud_cover: 'cloudy',
            season: 'Winter',
            location: 'mountain'
        },
        cloudy: {
            temperature: 21,
            humidity: 72,
            wind_speed: 9.5,
            precipitation: 20,
            pressure: 1012,
            uv_index: 4,
            visibility: 8,
            cloud_cover: 'partly cloudy',
            season: 'Autumn',
            location: 'inland'
        }
    };

    // Apply Preset function
    function applyPreset(presetKey) {
        const data = PRESETS[presetKey];
        if (!data) return;

        for (const [key, val] of Object.entries(data)) {
            const input = document.getElementById(key);
            if (input) {
                input.value = val;
            }
        }

        // Auto trigger prediction on preset click
        handlePredict();
    }

    // Preset buttons click listeners
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.getAttribute('data-preset');
            applyPreset(presetKey);
        });
    });

    // Weather SVGs
    const WEATHER_SVGS = {
        'Sunny': `
            <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5" fill="#f59e0b" fill-opacity="0.25"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        `,
        'Rainy': `
            <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" fill="#3b82f6" fill-opacity="0.2"></path>
                <line x1="8" y1="19" x2="8" y2="21"></line>
                <line x1="8" y1="13" x2="8" y2="15"></line>
                <line x1="16" y1="19" x2="16" y2="21"></line>
                <line x1="16" y1="13" x2="16" y2="15"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="12" y1="15" x2="12" y2="17"></line>
            </svg>
        `,
        'Snowy': `
            <svg viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                <line x1="19.07" y1="4.93" x2="4.93" y2="19.07"></line>
                <circle cx="12" cy="12" r="3" fill="#06b6d4" fill-opacity="0.3"></circle>
            </svg>
        `,
        'Cloudy': `
            <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="#94a3b8" fill-opacity="0.25"></path>
            </svg>
        `
    };

    // Color mapper for probability bars
    const CLASS_COLORS = {
        'Sunny': '#f59e0b',
        'Rainy': '#3b82f6',
        'Snowy': '#06b6d4',
        'Cloudy': '#94a3b8'
    };

    // Main prediction handler
    async function handlePredict(e) {
        if (e) e.preventDefault();

        // Button loading state
        submitBtn.disabled = true;
        btnSpinner.style.display = 'inline-block';
        btnIcon.style.display = 'none';
        btnText.textContent = 'Analyzing Weather Patterns...';

        const payload = {
            temperature: parseFloat(document.getElementById('temperature').value),
            humidity: parseFloat(document.getElementById('humidity').value),
            wind_speed: parseFloat(document.getElementById('wind_speed').value),
            precipitation: parseFloat(document.getElementById('precipitation').value),
            pressure: parseFloat(document.getElementById('pressure').value),
            uv_index: parseFloat(document.getElementById('uv_index').value),
            visibility: parseFloat(document.getElementById('visibility').value),
            cloud_cover: document.getElementById('cloud_cover').value,
            season: document.getElementById('season').value,
            location: document.getElementById('location').value
        };

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const res = await response.json();

            if (!res.success) {
                alert(`Prediction Error: ${res.error}`);
                return;
            }

            renderPrediction(res);

        } catch (err) {
            console.error('Request failed:', err);
            alert('Failed to connect to the prediction server. Please make sure Flask app.py is running.');
        } finally {
            submitBtn.disabled = false;
            btnSpinner.style.display = 'none';
            btnIcon.style.display = 'inline-block';
            btnText.textContent = 'Predict Weather Condition';
        }
    }

    // Render result to DOM
    function renderPrediction(data) {
        // Toggle view
        resultPlaceholder.style.display = 'none';
        resultContent.style.display = 'block';

        const pred = data.prediction;
        const insights = data.insights;

        // Theme switching on body
        document.body.className = `theme-${pred.toLowerCase()}`;

        // Header info
        predictionBadge.textContent = pred;
        predictionConfidence.textContent = `${data.confidence}%`;
        predictionHeadline.textContent = pred;
        predictionTagline.textContent = insights.tagline;
        predictionAdvice.textContent = insights.advice;

        // Icon
        weatherIconContainer.innerHTML = WEATHER_SVGS[pred] || WEATHER_SVGS['Cloudy'];

        // Probability bars
        probBarsContainer.innerHTML = '';
        if (data.probabilities && Object.keys(data.probabilities).length > 0) {
            // Sort highest to lowest
            const sortedProbs = Object.entries(data.probabilities).sort((a, b) => b[1] - a[1]);
            sortedProbs.forEach(([clsName, pct]) => {
                const color = CLASS_COLORS[clsName] || '#6366f1';
                const row = document.createElement('div');
                row.className = 'prob-item';
                row.innerHTML = `
                    <span class="prob-class-name">${clsName}</span>
                    <div class="prob-bar-track">
                        <div class="prob-bar-fill" style="width: ${pct}%; background-color: ${color};"></div>
                    </div>
                    <span class="prob-pct">${pct}%</span>
                `;
                probBarsContainer.appendChild(row);
            });
        }

        // Input Snapshot
        snapshotContainer.innerHTML = '';
        const summaryMap = [
            { label: 'Temp', val: data.input_summary.temperature },
            { label: 'Humidity', val: data.input_summary.humidity },
            { label: 'Wind', val: data.input_summary.wind_speed },
            { label: 'Precip', val: data.input_summary.precipitation },
            { label: 'Pressure', val: data.input_summary.pressure },
            { label: 'UV', val: data.input_summary.uv_index },
            { label: 'Visib.', val: data.input_summary.visibility },
            { label: 'Cloud', val: data.input_summary.cloud_cover }
        ];

        summaryMap.forEach(item => {
            const pill = document.createElement('div');
            pill.className = 'snapshot-pill';
            pill.innerHTML = `
                <span class="snapshot-pill-label">${item.label}</span>
                <span class="snapshot-pill-val">${item.val}</span>
            `;
            snapshotContainer.appendChild(pill);
        });

        // Smooth scroll to result on mobile
        if (window.innerWidth <= 1024) {
            document.getElementById('result-card').scrollIntoView({ behavior: 'smooth' });
        }
    }

    form.addEventListener('submit', handlePredict);
});
