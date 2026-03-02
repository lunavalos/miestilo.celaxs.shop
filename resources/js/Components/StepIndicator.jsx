import React from 'react';

export default function StepIndicator({ currentStep, steps }) {
    return (
        <div className="step-indicator-container">
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;

                return (
                    <React.Fragment key={index}>
                        <div className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                            <div className="step-circle">
                                {isCompleted ? (
                                    <i className="fas fa-check"></i>
                                ) : (
                                    stepNumber
                                )}
                            </div>
                            <span className="step-label">{step}</span>
                        </div>
                        {/* Connector line between steps */}
                        {index < steps.length - 1 && (
                            <div className={`step-connector ${isCompleted ? 'completed' : ''}`}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
