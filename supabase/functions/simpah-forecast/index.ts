// SIMPAH - Forecasting Edge Function
// Holt-Winters Triple Exponential Smoothing (Additive)
// Menggantikan Python Prophet backend dengan solusi serverless murni TypeScript

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Holt-Winters Triple Exponential Smoothing (Additive) ───
// Cocok untuk data time-series harian dengan pola musiman mingguan
// Additive dipilih agar aman menangani nilai 0

interface HWResult {
  forecasts: number[];
  fitted: number[];
  residuals: number[];
}

function holtWintersAdditive(
  data: number[],
  seasonLength: number,
  forecastHorizon: number,
  alpha = 0.35,
  beta = 0.08,
  gamma = 0.25
): HWResult {
  const n = data.length;

  // ── Inisialisasi ──
  // Level awal = rata-rata season pertama
  const firstSeasonAvg =
    data.slice(0, seasonLength).reduce((a, b) => a + b, 0) / seasonLength;

  // Trend awal = rata-rata selisih antar season
  let trend = 0;
  if (n >= seasonLength * 2) {
    const secondSeasonAvg =
      data.slice(seasonLength, seasonLength * 2).reduce((a, b) => a + b, 0) /
      seasonLength;
    trend = (secondSeasonAvg - firstSeasonAvg) / seasonLength;
  }

  // Seasonal awal = selisih tiap titik dari rata-rata season pertama
  const seasonal: number[] = new Array(n + forecastHorizon + seasonLength).fill(0);
  for (let i = 0; i < seasonLength; i++) {
    seasonal[i] = data[i] - firstSeasonAvg;
  }

  let level = firstSeasonAvg;
  const fitted: number[] = [];

  // ── Smoothing Pass ──
  for (let t = 0; t < n; t++) {
    const prevLevel = level;
    const prevTrend = trend;

    // Seasonal index dari siklus sebelumnya
    const sIdx = t >= seasonLength ? t : t;

    // Update level
    level =
      alpha * (data[t] - seasonal[sIdx]) +
      (1 - alpha) * (prevLevel + prevTrend);

    // Update trend
    trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;

    // Update seasonal (tulis ke posisi siklus berikutnya)
    seasonal[t + seasonLength] =
      gamma * (data[t] - level) + (1 - gamma) * seasonal[sIdx];

    // Fitted value
    fitted.push(level + trend + seasonal[sIdx]);
  }

  // ── Residuals (untuk confidence interval) ──
  const residuals = data.map((val, i) => val - fitted[i]);

  // ── Generate Forecasts ──
  const forecasts: number[] = [];
  for (let h = 1; h <= forecastHorizon; h++) {
    // Ambil komponen seasonal dari siklus terakhir yang tersedia
    const sIdx = n + h - seasonLength;
    const seasonalComponent = sIdx >= 0 ? seasonal[sIdx] : seasonal[(h - 1) % seasonLength];
    const forecast = level + h * trend + seasonalComponent;
    forecasts.push(Math.max(0, Math.round(forecast * 100) / 100));
  }

  return { forecasts, fitted, residuals };
}

// ── Double Exponential Smoothing (Fallback untuk data < 2 season) ──
function doubleExponentialSmoothing(
  data: number[],
  forecastHorizon: number,
  alpha = 0.35,
  beta = 0.1
): HWResult {
  const n = data.length;

  let level = data[0];
  let trend = n >= 2 ? data[1] - data[0] : 0;

  const fitted: number[] = [];

  for (let t = 0; t < n; t++) {
    const prevLevel = level;
    level = alpha * data[t] + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    fitted.push(level + trend);
  }

  const residuals = data.map((val, i) => val - fitted[i]);

  const forecasts: number[] = [];
  for (let h = 1; h <= forecastHorizon; h++) {
    const forecast = level + h * trend;
    forecasts.push(Math.max(0, Math.round(forecast * 100) / 100));
  }

  return { forecasts, fitted, residuals };
}

// ── Confidence Interval dari residual standard deviation ──
function computeConfidenceIntervals(
  forecasts: number[],
  residuals: number[],
  zScore = 1.96 // 95% CI
): { lower: number[]; upper: number[] } {
  const n = residuals.length;
  const mean = residuals.reduce((a, b) => a + b, 0) / n;
  const variance = residuals.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (n - 1 || 1);
  const std = Math.sqrt(variance);

  const lower = forecasts.map((f, i) => {
    // Uncertainty meningkat seiring jarak forecast
    const widening = Math.sqrt(i + 1);
    return Math.max(0, Math.round((f - zScore * std * widening) * 100) / 100);
  });

  const upper = forecasts.map((f, i) => {
    const widening = Math.sqrt(i + 1);
    return Math.max(0, Math.round((f + zScore * std * widening) * 100) / 100);
  });

  return { lower, upper };
}

// ── Tambahkan hari ke date string ──
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// ─── Main Edge Function Handler ───
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { days = 7, historical_data, start_date } = await req.json();

    // Validasi input
    if (!historical_data || !Array.isArray(historical_data)) {
      return new Response(
        JSON.stringify({ status: 'error', detail: 'historical_data (array) is required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (historical_data.length < 3) {
      return new Response(
        JSON.stringify({
          status: 'error',
          detail: `Not enough data (${historical_data.length} points). Minimum 3 required.`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const data = historical_data.map((v: unknown) => Number(v) || 0);
    const forecastDays = Math.min(Math.max(1, days), 30); // Clamp 1-30
    const seasonLength = 7; // Pola mingguan

    // Pilih algoritma berdasarkan jumlah data
    let result: HWResult;
    let method: string;

    if (data.length >= seasonLength * 2) {
      // Cukup data untuk deteksi pola mingguan → Holt-Winters Triple
      result = holtWintersAdditive(data, seasonLength, forecastDays);
      method = 'holt_winters_additive';
    } else {
      // Data terlalu sedikit untuk seasonal → Double Exponential Smoothing
      result = doubleExponentialSmoothing(data, forecastDays);
      method = 'double_exponential_smoothing';
    }

    // Hitung confidence interval
    const ci = computeConfidenceIntervals(result.forecasts, result.residuals);

    // Format output agar kompatibel dengan format response ML Backend lama
    const startDate = start_date || new Date().toISOString().split('T')[0];
    const lastDataDate = addDays(startDate, data.length - 1);

    const forecastData = result.forecasts.map((predicted, i) => ({
      date: addDays(lastDataDate, i + 1),
      predicted_weight_kg: predicted,
      lower_bound: ci.lower[i],
      upper_bound: ci.upper[i],
    }));

    return new Response(
      JSON.stringify({
        status: 'success',
        method,
        forecast_days: forecastDays,
        historical_days_used: data.length,
        data: forecastData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Forecast Edge Function Error:', error.message);
    return new Response(
      JSON.stringify({ status: 'error', detail: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
