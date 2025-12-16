export const Theme = {
  fonts: {
    // アプリ全体（デフォルト）は Zen Kaku Gothic New
    regular: 'ZenKakuGothicNew_400Regular',
    bold: 'ZenKakuGothicNew_700Bold',
    black: 'ZenKakuGothicNew_900Black',
  },

  colors: {
    // brand
    primary: '#2563EB', // blue-600
    primary2: '#38BDF8', // sky-400
    primaryDark: '#1E40AF', // blue-800

    // text
    text: '#0B1220',
    textMuted: 'rgba(11,18,32,0.62)',

    // surfaces (glass)
    glass: 'rgba(255,255,255,0.36)',
    glassStrong: 'rgba(255,255,255,0.52)',
    stroke: 'rgba(255,255,255,0.62)',
    strokeSoft: 'rgba(37,99,235,0.14)',

    // neutrals
    bg: '#FFFFFF',
    bgSoft: '#F6FAFF',

    // status/priority
    // 優先度は「青の濃淡」で表現（濃い=高、普通=中、薄い=低）
    high: '#1E40AF', // blue-800
    medium: '#2563EB', // blue-600
    low: '#60A5FA', // blue-400

    dark: '#0B1220',
  },

  gradients: {
    app: ['#EAF6FF', '#F4F9FF', '#FFFFFF'],
    primary: ['#2563EB', '#38BDF8'],
    dark: ['#0B1220', '#1F2A44'],
  },

  radius: {
    card: 16,
    pill: 999,
  },
};
