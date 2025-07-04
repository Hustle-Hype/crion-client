import React from "react";

export const PetraIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect width="48" height="48" rx="12" fill="url(#petra-gradient)" />
        <path
            d="M24 8C31.732 8 38 14.268 38 22C38 29.732 31.732 36 24 36C16.268 36 10 29.732 10 22C10 14.268 16.268 8 24 8Z"
            fill="white"
            fillOpacity="0.9"
        />
        <path
            d="M24 12C29.523 12 34 16.477 34 22C34 27.523 29.523 32 24 32C18.477 32 14 27.523 14 22C14 16.477 18.477 12 24 12Z"
            fill="url(#petra-inner)"
        />
        <circle cx="24" cy="22" r="6" fill="white" />
        <defs>
            <linearGradient
                id="petra-gradient"
                x1="0"
                y1="0"
                x2="48"
                y2="48"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#4F46E5" />
                <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient
                id="petra-inner"
                x1="14"
                y1="12"
                x2="34"
                y2="32"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
        </defs>
    </svg>
);

export const MartianIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect width="48" height="48" rx="12" fill="url(#martian-gradient)" />
        <path
            d="M24 10L34 18V30L24 38L14 30V18L24 10Z"
            fill="white"
            fillOpacity="0.9"
        />
        <path
            d="M24 14L30 20V28L24 34L18 28V20L24 14Z"
            fill="url(#martian-inner)"
        />
        <defs>
            <linearGradient
                id="martian-gradient"
                x1="0"
                y1="0"
                x2="48"
                y2="48"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#F59E0B" />
                <stop offset="1" stopColor="#EF4444" />
            </linearGradient>
            <linearGradient
                id="martian-inner"
                x1="18"
                y1="14"
                x2="30"
                y2="34"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#FBBF24" />
                <stop offset="1" stopColor="#F87171" />
            </linearGradient>
        </defs>
    </svg>
);

export const PontemIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect width="48" height="48" rx="12" fill="url(#pontem-gradient)" />
        <path
            d="M14 24L24 14L34 24L24 34L14 24Z"
            fill="white"
            fillOpacity="0.9"
        />
        <path
            d="M18 24L24 18L30 24L24 30L18 24Z"
            fill="url(#pontem-inner)"
        />
        <defs>
            <linearGradient
                id="pontem-gradient"
                x1="0"
                y1="0"
                x2="48"
                y2="48"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#10B981" />
                <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient
                id="pontem-inner"
                x1="18"
                y1="18"
                x2="30"
                y2="30"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#34D399" />
                <stop offset="1" stopColor="#22D3EE" />
            </linearGradient>
        </defs>
    </svg>
);
