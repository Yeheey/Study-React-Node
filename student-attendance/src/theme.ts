import type { ThemeConfig } from 'antd'

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1f6b4a',
    colorInfo: '#1f6b4a',
    colorWarning: '#b86a1c',
    colorError: '#b42318',
    borderRadius: 8,
    colorBgLayout: '#f0f4f1',
  },
  components: {
    Layout: {
      siderBg: '#163528',
      triggerBg: '#12291f',
      headerBg: '#ffffff',
      headerHeight: 64,
      headerPadding: '0 24px',
    },
    Menu: {
      darkItemBg: '#163528',
      darkPopupBg: '#163528',
      darkItemSelectedBg: '#1f6b4a',
      darkItemHoverBg: 'rgba(255,255,255,0.08)',
    },
  },
}
