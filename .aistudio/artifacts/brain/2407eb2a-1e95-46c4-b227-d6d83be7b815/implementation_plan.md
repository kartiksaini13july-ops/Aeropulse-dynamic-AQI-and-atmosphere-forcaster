# AeroPulse: Scientific Research Console & Predictive ML Studio

Transition AeroPulse from a stylized aesthetic to an authentic, high-density atmospheric research console, and introduce a dedicated Predictive Machine Learning Studio that highlights core Data Science competencies (multivariate regression, autoregressive lag modeling, feature sensitivity analysis, and residual diagnostics).

## User Review & Critical Decisions

> [!IMPORTANT]
> The following directions have been confirmed and will guide the implementation:

- **Confirmed Aesthetic Direction**: Strip away all generic "vibecoded" artifacts (neon background glow blobs, floating gradient halos, decorative pulsing rings, and toy-like styling). Replace with a clinical, high-density scientific telemetry console built with neutral slate panels (`#090d16` / `#0f172a`), 1px crisp hairline borders (`#1e293b`), strict monospace tabular figures (`font-mono tabular-nums`), and restrained scientific palette conventions.
- **Confirmed Data Science Specialty**: Implement an interactive **Predictive ML Studio** featuring:
  1. Multi-model comparative regression (Multivariate Ridge Regression with L2 penalty vs. Autoregressive Lag ARDL model vs. Decision Tree surrogate).
  2. Statistical evaluation metrics ($R^2$, RMSE, MAE, MAPE).
  3. Feature Importance & Sensitivity weights (Wind Speed, Lagged PM2.5, NO₂, Boundary Layer Temperature, Humidity).
  4. Residual distribution diagnostics ($\hat{y} - y$) and Predicted vs. Actual scatter plot with $45^\circ$ line.
  5. Interactive "What-If" Covariate Sensitivity Simulator.
- **Confirmed Navigation & Layout Integration**: Add a dedicated **ML Studio** tab to the primary navigation bar alongside an executive **DS Telemetry & Model Performance Widget** on the main Overview console.

---

## 1. Overview & Core Concept

### What It Does
AeroPulse transforms from a general consumer air quality display into a serious, research-grade atmospheric observation and data science laboratory. It pairs real-time empirical atmospheric measurements (Open-Meteo API) with client-side statistical modeling and predictive machine learning algorithms running on real time-series covariates.

### Target Audience & Persona
- **Data Science & Environmental Engineering Students/Evaluators**: Specifically tailored for B.Tech Data Science project defense, viva voce examinations, and portfolio demonstration.
- **Atmospheric Researchers & Urban Analysts**: Users who need quantitative rigor, empirical metric validation, and predictive scenario modeling over aesthetic fluff.

### Key Value Delivered
Positions the creator undeniably as an accomplished Data Science student who understands end-to-end data pipelines: feature extraction, lag engineering, multivariate regression modeling, residual validation, and interactive scientific visualization.

---

## 2. User Experience & Visual Design

### De-Vibecoding & Anti-Slop Visual Constitution
1. **Background & Atmosphere**:
   - Remove `AtmosphericAmbientBackground`'s colored neon blur blooms.
   - Replace with a clean, deep space obsidian canvas (`#07090e`) with crisp, non-distracting hairline structural grids.
2. **Card & Panel Construction**:
   - Flat slate panels (`bg-[#0c1220]` / `border border-slate-800/80`) with zero decorative box-shadow glows or rainbow borders.
   - Outer container padding $\ge$ inner component padding.
   - Zero pill tags or capsule badges for static metadata; clean unboxed typography with bullet (`·`) separators.
3. **Map Refinement**:
   - Streamline map markers from flashy pulsating disks into sharp, calibrated scientific telemetry beacons with precise crosshair coordinates.
   - Maintain the animated wind streamlines particle canvas as an empirical vector flow layer, but tone particle colors to a scientific cool cyan-grey.
4. **Typographic Discipline**:
   - Header & Interface: Clean geometric sans-serif (`Plus Jakarta Sans` / system technical sans).
   - Metrics, Coordinates, and Math: Strict `font-mono tabular-nums` for rock-solid vertical decimal alignment without layout jitter.
   - Every number visually paired with its physical scientific unit ($\mu\text{g/m}^3$, $\text{km/h}$, $^{\circ}\text{C}$, $\text{hPa}$).

---

## 3. Key Product Decisions & Data Science Architecture

### Decision 1: Real Client-Side Statistical & ML Engine
- **Chosen Approach**: Build a self-contained, high-performance mathematical modeling engine (`src/services/mlPredictiveEngine.ts`) executing standard matrix linear algebra (Ridge regression closed-form $\mathbf{\beta} = (\mathbf{X}^T\mathbf{X} + \lambda\mathbf{I})^{-1}\mathbf{X}^T\mathbf{y}$) and recursive autoregressive forecasting.
- **Why**: Zero external API dependencies or latency; executes in real time directly on the 72-hour historical observation dataset; fully inspectable and reproducible for academic examination.
- **Alternatives Considered**: Mock/static hardcoded ML scores (rejected: violates academic authenticity and looks fake to DS professors).

### Decision 2: Model Comparison & Diagnostic Triad
- **Model A: Multivariate Ridge Regression ($\text{L2}$)**:
  $$\hat{y}_t = \beta_0 + \beta_1 \cdot \text{Wind}_t + \beta_2 \cdot \text{Temp}_t + \beta_3 \cdot \text{Humidity}_t + \beta_4 \cdot \text{NO}_{2,t} + \lambda \|\mathbf{\beta}\|_2^2$$
- **Model B: Autoregressive Distributed Lag (ARDL(2, 1))**:
  $$\hat{y}_t = \phi_1 y_{t-1} + \phi_2 y_{t-2} + \gamma_0 \text{Wind}_t + \gamma_1 \text{Wind}_{t-1} + \epsilon_t$$
- **Model C: Decision Tree Split Surrogate**:
  Piecewise non-linear thresholding capturing boundary layer stagnation traps when $\text{Wind} < 8\text{ km/h}$.
- **Metrics Evaluated**:
  $$R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}, \quad \text{RMSE} = \sqrt{\frac{1}{n}\sum (y_i - \hat{y}_i)^2}, \quad \text{MAE} = \frac{1}{n}\sum |y_i - \hat{y}_i|$$

---

## 4. Technical Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          AeroPulse Shell                               │
│  [Wordmark] ── [Overview · Map · Trends · Comparison · ML Studio · Viva] │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴────────────────────────┐
          ▼                                                  ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│       Overview Console       │        │       ML Studio View         │
│  - Calibrated Speed Gauge    │        │ ┌──────────────────────────┐ │
│  - Atmospheric Telemetry     │        │ │ Model Selector & Config  │ │
│  - Chemical Component Matrix │        │ └────────────┬─────────────┘ │
│  - DS Quick Model Metric Kpi │        │              ▼               │
└──────────────────────────────┘        │ ┌──────────────────────────┐ │
                                        │ │ Actual vs Predicted Time │ │
                                        │ │ Series Horizon Chart     │ │
                                        │ └────────────┬─────────────┘ │
                                        │              ▼               │
                                        │ ┌──────────────────────────┐ │
                                        │ │ Regression Metrics:      │ │
                                        │ │ R², RMSE, MAE, MAPE      │ │
                                        │ └────────────┬─────────────┘ │
                                        │              ▼               │
                                        │ ┌──────────────────────────┐ │
                                        │ │ Feature Sensitivity &    │ │
                                        │ │ Beta Importance Weights  │ │
                                        │ └────────────┬─────────────┘ │
                                        │              ▼               │
                                        │ ┌──────────────────────────┐ │
                                        │ │ Residual Distribution &  │ │
                                        │ │ Homoscedasticity Plot    │ │
                                        │ └────────────┬─────────────┘ │
                                        │              ▼               │
                                        │ ┌──────────────────────────┐ │
                                        │ │ Interactive Covariate    │ │
                                        │ │ Sensitivity Simulator    │ │
                                        │ └──────────────────────────┘ │
                                        └──────────────────────────────┘
```

### Component & State Mapping

| Module / File | Role & Data Transformation |
| :--- | :--- |
| `src/services/mlPredictiveEngine.ts` | Mathematical core: matrix transposition, inversion, Ridge solving, lag feature engineering, metric calculations ($R^2$, RMSE, MAE), and residual generation. |
| `src/components/MLStudioView.tsx` | Dedicated Data Science view housing the model comparator, horizon charts, beta weightings, and residual diagnostics. |
| `src/components/DSMetricSummaryCard.tsx` | Executive Data Science telemetry card embedded into the main Overview dashboard showing live model fidelity ($R^2$) and top sensitivity driver. |
| `src/components/Navbar.tsx` | Update navigation links to include **ML Studio** with clean, single-line typography. |
| `src/components/AtmosphericAmbientBackground.tsx` | Strip out cartoonish glowing colored blurs; establish clean, dark laboratory canvas with subtle coordinate grid. |
| `src/components/AQIGauge.tsx` & `src/components/InteractiveMap.tsx` | Clean up styling: replace garish glow filters with precise hairline borders and calibrated indicator needles. |

---

## 5. Implementation Phases

1. **Phase 1: Mathematical ML Engine (`mlPredictiveEngine.ts`)**:
   - Implement matrix operations (dot product, transpose, inverse with L2 regularization).
   - Generate lag features ($y_{t-1}, y_{t-2}$) and meteorological feature normalization.
   - Train and cross-evaluate Ridge Regression and Autoregressive models on current station data.
2. **Phase 2: Visual De-Vibecoding & Aesthetic Reset**:
   - Remove flashy background glow blurs and pulsating circles across components.
   - Align all cards to flat slate surfaces (`#0c1220`) with 1px hairline borders (`#1e293b`).
   - Clean up typography, ensuring strict unboxed metadata and tabular numbers.
3. **Phase 3: Dedicated ML Studio View & Visualizations (`MLStudioView.tsx`)**:
   - Model Comparison Ribbon with $R^2$, RMSE, MAE, and MAPE KPI blocks.
   - Actual vs. Predicted time-series line chart with confidence band.
   - Normalized Feature Importance horizontal bar chart ($\beta$ weights).
   - Residual error histogram / scatter plot verifying error randomness.
   - Interactive Covariate Simulator allowing sliders for Wind, Temp, and Humidity to recalculate predictions in real-time.
4. **Phase 4: Navigation & Overview Dashboard Integration**:
   - Add "ML Studio" to Navbar navigation.
   - Embed DS Model KPI summary on Overview dashboard with 1-click drill-down.
   - Test build and compile with `compile_applet`.
