"use client";

const STEPS = [
  { num: 1, label: "概念与关键词" },
  { num: 2, label: "同义词匹配" },
  { num: 3, label: "数据库与模式" },
  { num: 4, label: "检索式预览" },
  { num: 5, label: "导出" },
];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export default function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Build progress" className="w-full">
      <ol className="flex flex-col md:flex-row items-stretch gap-0 bg-surface-card border border-hairline rounded-lg overflow-hidden">
        {STEPS.map((step) => {
          const isActive = currentStep === step.num;
          const isDone = currentStep > step.num;
          const isPending = currentStep < step.num;

          return (
            <li
              key={step.num}
              className={`flex-1 flex items-center gap-2.5 px-4 py-3 md:justify-center transition-colors duration-200 ${
                isActive
                  ? "bg-canvas text-primary"
                  : isDone
                  ? "text-semantic-success"
                  : "text-muted"
              } ${onStepClick ? "cursor-pointer hover:bg-canvas/60" : ""}`}
              role="button"
              tabIndex={onStepClick ? 0 : -1}
              aria-current={isActive ? "step" : undefined}
              onClick={() => onStepClick?.(step.num)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onStepClick?.(step.num);
                }
              }}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold font-mono shrink-0 transition-colors duration-200 ${
                  isActive
                    ? "bg-primary text-canvas"
                    : isDone
                    ? "bg-semantic-success/15 text-semantic-success"
                    : "bg-surface-card text-muted-soft"
                }`}
              >
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path
                      d="M2.5 6l2.5 2.5 4.5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step.num
                )}
              </span>
              <span className="text-sm font-medium whitespace-nowrap">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
