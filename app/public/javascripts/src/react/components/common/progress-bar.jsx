import React from 'react'
import { Progress } from '@mantine/core'

export const ProgressBar = ({ progress }) => 
  <div className="prog-bar">
    <Progress
      value={progress}
      size="xl"
      radius={2}
    />
    <div className="label">{`${Math.round(progress)}%`}</div>
    <style jsx>{`
      .prog-bar {
        position: relative;
      }
      .prog-bar :global(.mantine-Progress-bar) {
        opacity: 0.4;
      }
      .label {
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        font: bold 11px/1 Exo, sans-serif;
        color: black;
      }
    `}</style>
  </div>
