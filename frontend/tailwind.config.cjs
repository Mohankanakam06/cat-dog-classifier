/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: '#000000',
                    secondary: '#0a0a0a',
                    tertiary: '#171717',
                },
                accent: {
                    primary: '#f97316', // orange-500
                    secondary: '#fb923c', // orange-400
                    tertiary: '#ea580c', // orange-600
                },
                text: {
                    main: '#f1f5f9', // slate-100
                    secondary: '#cbd5e1', // slate-300
                    muted: '#94a3b8', // slate-400
                },
                border: {
                    DEFAULT: '#262626', // neutral-800
                    light: '#404040', // neutral-700
                },
                success: '#10b981',
                danger: '#ef4444',
                warning: '#f59e0b',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 3s linear infinite',
            },
        },
    },
    plugins: [],
}
