/**
 * Centralized Theme Configuration
 *
 * This file contains all color definitions for the UniEventClient application.
 * Colors are organized by purpose and include both light and dark mode variants.
 *
 * These values are used throughout the app via CSS variables defined in theme.css.
 * To change a color globally, update the value here and the corresponding CSS variable.
 *
 * Reference CSS variables in components and stylesheets:
 * - Light mode: :root { --dtu-accent: #E85D3B; }
 * - Dark mode: html.dark { --dtu-accent: #3C54F0; }
 */

export const themeConfig = {
    /**
     * PRIMARY BRAND COLORS
     * The main accent colors that define the brand identity.
     * Light mode: DTU Salmon/Orange, Dark mode: DTU Blue
     */
    colors: {
        primary: {
            light: {
                main: '#E85D3B', // DTU Salmon (main accent)
                light: '#F5B8A6', // Lighter salmon for headers
                dark: '#D84D2B', // Darker salmon for hover/active
            },
            dark: {
                main: '#3C54F0', // DTU Blue (main accent)
                light: '#5E73FF', // Lighter blue
                dark: '#3347D2', // Darker blue for hover/active
            },
        },

        /**
         * BACKGROUND COLORS
         * Used for page backgrounds, cards, and panels
         */
        background: {
            light: {
                primary: '#FFF9F7', // Main page background
                secondary: '#F5EAE8', // Secondary background
                card: '#FFFFFF', // Card/modal background
            },
            dark: {
                primary: '#0A1A4F', // Main page background
                secondary: '#0D1F54', // Secondary background
                card: 'rgba(20, 24, 50, 0.6)', // Card/modal with transparency
            },
        },

        /**
         * TEXT COLORS
         * For content and labels
         */
        text: {
            light: {
                primary: '#1F1F1F', // Main text
                body: '#444444', // Body text, slightly lighter
                subtle: '#777777', // Subtle/muted text (labels, hints)
            },
            dark: {
                primary: '#FFFFFF', // Main text
                body: '#D5D8E0', // Body text, slightly darker white
                subtle: '#8C92A5', // Subtle/muted text
            },
        },

        /**
         * UI ELEMENT COLORS
         * Borders, inputs, panels, and interactive elements
         */
        ui: {
            light: {
                border: '#E8D5D0', // Panel and input borders
                inputBg: '#FFFFFF', // Input field background
                panelBg: 'rgba(255, 255, 255, 0.9)', // Panel background with slight transparency
                buttonHover: 'rgba(232, 93, 59, 0.1)', // Button hover state (light salmon tint)
            },
            dark: {
                border: 'rgba(255, 255, 255, 0.25)', // Panel and input borders
                inputBg: 'rgba(25, 32, 58, 0.55)', // Input field background
                panelBg: 'rgba(18, 20, 36, 0.7)', // Panel background with transparency
                buttonHover: 'rgba(30, 63, 242, 0.15)', // Button hover state (blue tint)
            },
        },

        /**
         * STATUS COLORS
         * Used to indicate validation states, errors, and success messages
         */
        status: {
            error: {
                light: '#8b1a1a', // Error text color (light mode)
                lightBg: '#ffb0b0', // Error background light (light mode)
                dark: '#ffb0b0', // Error text color (dark mode)
                darkBg: '#8b1a1a', // Error background dark (dark mode)
            },
            success: {
                light: '#1f6b3d', // Success text color (light mode)
                lightBg: '#9cf0c2', // Success background light (light mode)
                dark: '#9cf0c2', // Success text color (dark mode)
                darkBg: '#1f6b3d', // Success background dark (dark mode)
            },
        },

        /**
         * HEADER COLORS
         * Specific colors for the page header component
         */
        header: {
            light: {
                bg: '#F5B8A6', // Header background
                bgSecondary: '#FAD8CF', // Secondary header background
                text: '#1F1F1F', // Header text
                subtitle: '#6B6B6B', // Header subtitle text
                shadow: 'rgba(245, 184, 166, 0.12)', // Header shadow color
            },
            dark: {
                bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a14 25%, #1a1f3a 60%, #0a0a0a 100%)', // Header gradient
                bgSecondary: '#0A1F6A', // Secondary header background
                text: '#FFFFFF', // Header text
                subtitle: '#A8AFBE', // Header subtitle text
                shadow: 'rgba(255, 255, 255, 0.25)', // Header shadow color
            },
        },

        /**
         * LINK COLORS
         * Used for anchor tags and link-like elements
         */
        links: {
            light: {
                primary: '#E85D3B', // Link color
                hover: '#D84D2B', // Link hover color
            },
            dark: {
                primary: '#1E3FF2', // Link color
                hover: '#4B6FFF', // Link hover color
            },
        },

        /**
         * TOGGLE/SWITCH COLORS
         * Used for the theme toggle switch
         */
        toggle: {
            light: {
                track: '#d0d0d0', // Toggle track background (light mode)
                thumb: '#ffffff', // Toggle thumb/circle (light mode)
                icon: '#1a1a1a', // Toggle icon color (light mode)
            },
            dark: {
                track: '#000000', // Toggle track background (dark mode)
                thumb: '#111111', // Toggle thumb/circle (dark mode)
                icon: '#ffffff', // Toggle icon color (dark mode)
            },
        },

        /**
         * SHADOW COLORS
         * Base colors for box shadows
         */
        shadows: {
            light: {
                color: 'rgba(139, 69, 19, 0.12)', // Shadow color (light mode)
                colorHover: 'rgba(139, 69, 19, 0.18)', // Shadow color on hover (light mode)
            },
            dark: {
                color: 'rgba(40, 60, 140, 0.25)', // Shadow color (dark mode)
                colorHover: 'rgba(255, 255, 255, 0.25)', // Shadow color on hover (dark mode)
            },
        },

        /**
         * TRANSPARENCY/OPACITY VALUES
         * Used for overlay, glass-morphism, and semi-transparent elements
         * Note: These are typically embedded in Tailwind arbitrary values
         * Documented here for reference and future refactoring
         */
        transparency: {
            likeButtonLight: 'rgba(255, 255, 255, 0.18)', // Like button light background
            likeButtonLightHover: 'rgba(255, 255, 255, 0.26)', // Like button light hover
            likeButtonDark: 'rgba(18, 20, 36, 0.72)', // Like button dark background
            likeButtonDarkHover: 'rgba(30, 63, 242, 0.16)', // Like button dark hover
            focusRing: 'rgba(60, 84, 240, 0.24)', // Input focus ring
            glowLarge: 'rgba(60, 84, 240, 0.12)', // Card glow effect (large)
            glowMedium: 'rgba(232, 93, 59, 0.12)', // Card glow effect (medium)
            glowSmall: 'rgba(255, 255, 255, 0.06)', // Card glow effect (small)
        },
    },

    /**
     * GRADIENTS
     * Used for page backgrounds and decorative elements
     */
    gradients: {
        light: 'linear-gradient(135deg, #FFF9F7 0%, #F5EAE8 25%, #FCF5F0 65%, #FFFBFA 100%)',
        dark: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a14 25%, #1a1f3a 60%, #0a0a0a 100%)',
    },
};

/**
 * CSS Variable Reference Guide
 * These variables are defined in web/src/styles/theme.css
 * Use them in stylesheets and Tailwind classes:
 *
 * LIGHT MODE (default, :root)
 * --dtu-primary-bg: Primary background
 * --dtu-secondary-bg: Secondary background
 * --dtu-card-bg: Card background
 * --dtu-accent: Main accent color
 * --dtu-accent-light: Light accent
 * --dtu-accent-hover: Accent hover state
 * --header-bg: Header background
 * --header-bg-secondary: Secondary header
 * --header-text: Header text
 * --header-subtitle: Header subtitle
 * --header-shadow: Header shadow
 * --text-primary: Main text
 * --text-body: Body text
 * --text-subtle: Subtle text
 * --panel-bg: Panel background
 * --panel-border: Panel border
 * --input-bg: Input background
 * --input-border: Input border
 * --input-focus-border: Input focus border
 * --input-text: Input text
 * --button-hover: Button hover background
 * --shadow-color: Shadow color
 * --shadow-color-hover: Shadow hover color
 * --link-primary: Link color
 * --link-primary-hover: Link hover color
 * --status-error: Error text color
 * --status-error-light: Error light color
 * --status-success: Success text color
 * --status-success-light: Success light color
 * --toggle-track-light: Toggle track (light mode)
 * --toggle-thumb-light: Toggle thumb (light mode)
 * --toggle-icon-light: Toggle icon (light mode)
 *
 * DARK MODE (html.dark)
 * All the above variables are redefined for dark mode in html.dark {}
 */
