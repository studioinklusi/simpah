import os
import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from prophet import Prophet
import pandas as pd
from dotenv import load_dotenv
import httpx

# Load env variables
load_dotenv()

app = FastAPI(title="SIMPAH Prophet Forecasting API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: SUPABASE_URL or SUPABASE_KEY not set in .env")

class ForecastRequest(BaseModel):
    days: int = 7
    historical_data: list[float]
    start_date: str

@app.post("/forecast")
def generate_forecast(req: ForecastRequest):
    try:
        data_values = req.historical_data
        
        if len(data_values) < 3:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough historical data ({len(data_values)} days). Minimum 3 days required."
            )

        # 2. Process data for Prophet
        # Generate dates starting from start_date
        import pandas as pd
        from datetime import datetime, timedelta
        
        start = datetime.strptime(req.start_date, '%Y-%m-%d')
        dates = [start + timedelta(days=i) for i in range(len(data_values))]
        
        df_daily = pd.DataFrame({
            'ds': dates,
            'y': data_values
        })
        
        print(f"[ML] Received {len(df_daily)} daily data points from frontend")

        # 3. Initialize and fit Prophet model
        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=True,
            daily_seasonality=False
        )
        model.fit(df_daily)
        print(f"[ML] Prophet model fitted successfully")

        # 4. Create future dataframe and predict
        future = model.make_future_dataframe(periods=req.days)
        forecast = model.predict(future)

        # 5. Extract forecasted data
        forecast_results = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(req.days)
        
        result = []
        for _, row in forecast_results.iterrows():
            result.append({
                "date": row['ds'].strftime('%Y-%m-%d'),
                "predicted_weight_kg": max(0, round(row['yhat'], 2)),
                "lower_bound": max(0, round(row['yhat_lower'], 2)),
                "upper_bound": max(0, round(row['yhat_upper'], 2))
            })

        print(f"[ML] Forecast generated: {len(result)} data points")

        return {
            "status": "success",
            "forecast_days": req.days,
            "historical_days_used": len(df_daily),
            "data": result
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ML] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
