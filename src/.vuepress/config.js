const { description } = require('../../package')

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: 'Mixin Virtual Machine',
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: description,

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
   markdown: {
    extendMarkdown: (md) => {
      md.use(require("markdown-it-katex"));
    },
  },
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],

  footer: {
  },

  theme: "cosmos",
  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    repo: 'MixinNetwork/mvm.dev',
    editLinks: false,
    docsDir: '',
    docsBranch: 'main',
    editLinkText: '',
    custom: true,
    lastUpdated: false,
    nav: [
    ],
    // Logo in the top left corner, file in .vuepress/public/
    logo: {
      src: "/mvm.svg",
    },
    // Configure the manual sidebar
    header: {
      img: {
        // Image in ./vuepress/public/logo.svg
        src: "/logo.svg",
        // Image width relative to the sidebar
        width: "75%",
      },
      title: "Documentation",
    },
    topbar: {
      banner: false
    },
    sidebar: {
      auto: false,
      nav: [
        {
          title: 'Reference',
          children: [
            {
              title: 'Introduction',
              directory: false,
              path: '/reference/intro'
            },
            {
              title: 'Core Concepts',
              directory: false,
              path: '/reference/core'
            }
          ]
        },
        {
          title: 'Guides',
          children: [
            {
              title: 'Development',
              directory: false,
              path: '/guide/basic'
            },
            {
              title: 'Publish',
              directory: false,
              path: '/guide/publish'
            },
            {
              title: 'Invoke',
              directory: false,
              path: '/guide/invoke'
            },
          ]
        },
        {
          title: 'MVM Codes',
          children: [
            {
              title: 'Structure',
              directory: false,
              path: '/codes/structure'
            },
            {
              title: 'Registry',
              directory: false,
              path: '/codes/registry'
            },
          ],
        },
        {
          title: 'ABI Spec',
          children: [
            {
              title: 'intro',
              directory: false,
              path: '/abi/intro'
            },
          ]
        },
        {
          title: 'Testnet',
          children: [
            {
              title: 'Join',
              directory: false,
              path: '/testnet/join'
            },
          ]
        },
        {
          title: 'Resources',
          children: [
            {
              title: 'Q/A',
              directory: false,
              path: '/resources/qa'
            },
          ]
        },
      ]
    }
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom',
  ]
}
