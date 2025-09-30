import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				md: '2rem',
				lg: '2rem',
				xl: '2rem'
			},
			screens: {
				'2xl': '1400px'
			}
		},
			extend: {
				fontFamily: {
					sans: ['Inter', 'system-ui', 'sans-serif'],
					inter: ['Inter', 'system-ui', 'sans-serif'],
					oswald: ['Oswald', 'sans-serif'],
					opensans: ['"Open Sans"', 'sans-serif'],
					sora: ['Sora', 'sans-serif'],
				},
				fontSize: {
					'hero': ['var(--text-hero)', { lineHeight: 'var(--leading-hero)', letterSpacing: 'var(--tracking-hero)' }],
					'h1-premium': ['var(--text-h1)', { lineHeight: 'var(--leading-heading)', letterSpacing: 'var(--tracking-heading)' }],
					'h2-premium': ['var(--text-h2)', { lineHeight: 'var(--leading-heading)', letterSpacing: 'var(--tracking-heading)' }],
					'h3-premium': ['var(--text-h3)', { lineHeight: 'var(--leading-heading)', letterSpacing: 'var(--tracking-heading)' }],
					'body-premium': ['var(--text-body)', { lineHeight: 'var(--leading-body)', letterSpacing: 'var(--tracking-body)' }],
					'body-lg-premium': ['var(--text-body-lg)', { lineHeight: 'var(--leading-relaxed)', letterSpacing: 'var(--tracking-body)' }],
					'caption-premium': ['var(--text-caption)', { lineHeight: 'var(--leading-body)', letterSpacing: 'var(--tracking-wide)' }],
				},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(var(--primary-light))',
					dark: 'hsl(var(--primary-dark))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					light: 'hsl(var(--accent-light))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Sophisticated Aksell Color Palette
				aksell: {
					coral: 'hsl(var(--aksell-coral))',
					amber: 'hsl(var(--aksell-amber))',
					rust: 'hsl(var(--aksell-rust))',
					wine: 'hsl(var(--aksell-wine))',
					cream: 'hsl(var(--aksell-cream))',
					sage: 'hsl(var(--aksell-sage))',
					slate: 'hsl(var(--aksell-slate))',
					pearl: 'hsl(var(--aksell-pearl))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'lock-open': {
					'0%': { 
						transform: 'rotate(0deg) scale(1)', 
						filter: 'hue-rotate(0deg)'
					},
					'50%': { 
						transform: 'rotate(-15deg) scale(1.1)', 
						filter: 'hue-rotate(60deg)'
					},
					'100%': { 
						transform: 'rotate(-45deg) scale(1.05)', 
						filter: 'hue-rotate(120deg)'
					}
				},
				'lock-close': {
					'0%': { 
						transform: 'rotate(-45deg) scale(1.05)', 
						filter: 'hue-rotate(120deg)'
					},
					'50%': { 
						transform: 'rotate(-15deg) scale(1.1)', 
						filter: 'hue-rotate(60deg)'
					},
					'100%': { 
						transform: 'rotate(0deg) scale(1)', 
						filter: 'hue-rotate(0deg)'
					}
				},
				'paper-secure': {
					'0%': { 
						transform: 'translateY(0px) rotate(0deg)', 
						opacity: '0.7'
					},
					'50%': { 
						transform: 'translateY(-10px) rotate(2deg)', 
						opacity: '0.9'
					},
					'100%': { 
						transform: 'translateY(-8px) rotate(1deg)', 
						opacity: '1'
					}
				},
				'paper-release': {
					'0%': { 
						transform: 'translateY(-8px) rotate(1deg)', 
						opacity: '1'
					},
					'50%': { 
						transform: 'translateY(5px) rotate(-1deg)', 
						opacity: '0.8'
					},
					'100%': { 
						transform: 'translateY(0px) rotate(0deg)', 
						opacity: '0.9'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in-right': {
					'0%': { 
						transform: 'translateX(100%)',
						opacity: '0'
					},
					'100%': { 
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				'slide-out-right': {
					'0%': { 
						transform: 'translateX(0)',
						opacity: '1'
					},
					'100%': { 
						transform: 'translateX(100%)',
						opacity: '0'
					}
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'pulse-primary': {
					'0%, 100%': { 
						boxShadow: '0 0 0 0 hsl(var(--primary) / 0.4)',
						transform: 'scale(1)'
					},
					'50%': { 
						boxShadow: '0 0 0 10px hsl(var(--primary) / 0)',
						transform: 'scale(1.02)'
					}
				},
				'bounce-in': {
					'0%': { transform: 'scale(0.3)', opacity: '0' },
					'50%': { transform: 'scale(1.05)', opacity: '0.8' },
					'70%': { transform: 'scale(0.9)', opacity: '0.9' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'slide-in-up': {
					'0%': { transform: 'translateY(100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'title-shrink': {
					'0%': { transform: 'scale(1.15)', opacity: '0.9' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'fade-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'lock-open': 'lock-open 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
				'lock-close': 'lock-close 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
				'paper-secure': 'paper-secure 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
				'paper-release': 'paper-release 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
				'fade-in': 'fade-in 0.6s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'slide-out-right': 'slide-out-right 0.3s ease-out',
				'shimmer': 'shimmer 2s infinite',
				'pulse-primary': 'pulse-primary 2s infinite',
				'bounce-in': 'bounce-in 0.6s ease-out',
				'slide-in-up': 'slide-in-up 0.4s ease-out',
				'title-shrink': 'title-shrink 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both',
				'fade-up': 'fade-up 0.6s ease-out both'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
