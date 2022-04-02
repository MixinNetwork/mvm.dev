const { description } = require('../../package')

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: 'MVM 开发文档',
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
          title: '快速开始',
          children: [
            {
              title: '快速开始',
              path: '/start/1.guide',
            },
            {
              title: '计数器合约',
              path: '/start/2.counter'
            },
            {
              title: '转账合约',
              path: '/start/3.transfer'
            }
          ]
        },
        {
          title: '参考',
          children: [
            {
              title: '简介',
              directory: false,
              path: '/reference/intro'
            },
            {
              title: '术语介绍',
              directory: false,
              path: '/reference/core'
            },
            {
              title: 'Refund 合约',
              directory: false,
              path: '/reference/refund'
            },
            {
              title: 'Registry 合约',
              directory: false,
              path: '/reference/registry'
            },
          ]
        },
        {
          title: '开发及部署',
          children: [
            {
              title: '部署 uniswap',
              directory: false,
              path: '/guide/uniswap'
            },
            {
              title: '调用合约',
              directory: false,
              path: '/guide/usage'
            },
            {
              title: 'MVM 编码',
              directory: false,
              path: '/guide/encoding'
            },
          ]
        },
        {
          title: 'ABI 规范',
          children: [
            {
              title: '介绍',
              directory: false,
              path: '/abi/intro'
            },
          ]
        },
        {
          title: '测试网',
          children: [
            {
              title: '如何加入',
              directory: false,
              path: '/testnet/join'
            },
          ]
        },
        {
          title: '资源',
          children: [
            {
              title: '问答',
              directory: false,
              path: '/resources/qa'
            },
            {
              title: 'EVM ABI 文档',
              path: 'https://docs.soliditylang.org/en/latest/abi-spec.html'
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
