import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { FingerprintScores, CATEGORY_LABELS, CATEGORY_COLORS, ErrorCategory } from '../types';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface Props {
  scores: FingerprintScores;
  previousScores?: FingerprintScores;
}

export const FingerprintChart: React.FC<Props> = ({ scores, previousScores }) => {
  const categories: ErrorCategory[] = [
    'article_absence',
    'tense_marking',
    'preposition_transfer',
    'word_order',
    'pluralization',
    'gender_pronoun'
  ];

  const labels = categories.map(cat => CATEGORY_LABELS[cat]);
  const currentData = categories.map(cat => scores[cat] || 0);
  const prevData = previousScores ? categories.map(cat => previousScores[cat] || 0) : [];

  const data = {
    labels,
    datasets: [
      {
        label: 'Current Fingerprint',
        data: currentData,
        backgroundColor: 'rgba(99, 102, 241, 0.4)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
      },
      ...(previousScores ? [{
        label: 'Previous Fingerprint',
        data: prevData,
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        borderColor: 'rgba(156, 163, 175, 0.5)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointBackgroundColor: 'rgba(156, 163, 175, 0.5)',
        pointBorderColor: '#fff',
      }] : [])
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
    },
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          display: false,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: '#cbd5e1',
          font: {
            size: 11,
          }
        }
      },
    },
    plugins: {
      legend: {
        display: false,
      }
    }
  };

  // Find top category
  let topCategory: ErrorCategory | null = null;
  let maxVal = 0;
  categories.forEach(cat => {
    if (scores[cat] > maxVal) {
      maxVal = scores[cat];
      topCategory = cat;
    }
  });

  return (
    <div className="chart-container">
      <h3 className="chart-title">Your Error Fingerprint</h3>
      <div className="chart-wrapper">
        <Radar data={data} options={options} />
      </div>
      <div className="chart-legend">
        {categories.map(cat => {
          const isTop = cat === topCategory;
          return (
            <div key={cat} className={`legend-item ${isTop ? 'legend-item-top' : ''}`}>
              <span 
                className="legend-dot" 
                style={{ backgroundColor: CATEGORY_COLORS[cat] }}
              ></span>
              <span className="legend-label">{CATEGORY_LABELS[cat]}</span>
              <span className="legend-score">{scores[cat]?.toFixed(1) || 0}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
