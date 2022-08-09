const { description } = require('../../package')

module.exports = {
  locales: {
    // The key is the path for the locale to be nested under.
    // As a special case, the default locale can use '/' as its path.
    '/': {
      lang: 'en', // this will be set as the lang attribute on <html>
      label: 'English',
      name: 'Mixin Virtual Machine',
      /**
       * Ref：https://v1.vuepress.vuejs.org/config/#title
       */
      title: 'MVM development docs',
    },
    '/zh/': {
      lang: 'zh',
      label: '简体中文',
      name: 'MVM 开发文档',
      title: 'MVM 开发文档',
    }
  },
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
      src: "/logo.svg",
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
    locales: {
      '/': {
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
                },
              ]
            },

            {
              title: 'Registry Contract',
              children: [
                {
                  title: 'Principle',
                  directory: false,
                  path: '/registry/registry'
                },
                {
                  title: 'Deploy Contract',
                  directory: false,
                  path: '/registry/deploy'
                },
                {
                  title: 'Encoding',
                  directory: false,
                  path: '/registry/encoding'
                },
                {
                  title: 'Call Contract',
                  directory: false,
                  path: '/registry/call'
                },
                {
                  title: 'Handle Memo Error',
                  directory: false,
                  path: '/registry/long_memo'
                },
                {
                  title: 'Debug',
                  directory: false,
                  path: '/registry/debug'
                }
              ]
            },
            {
              title: 'Guides',
              children: [
                {
                  title: 'Deploy uniswap',
                  directory: false,
                  path: '/guide/uniswap'
                },
                {
                  title: 'Usage',
                  directory: false,
                  path: '/guide/usage'
                },
                {
                  title: 'Encoding',
                  directory: false,
                  path: '/guide/encoding'
                },
              ]
            },
            {
              title: 'ABI Spec',
              children: [
                {
                  title: 'Intro',
                  directory: false,
                  path: '/abi/intro'
                },
              ]
            },
            {
              title: 'Quorum',
              children: [
                {
                  title: 'Join',
                  directory: false,
                  path: '/quorum/join'
                },
              ]
            },
            {
              title: 'Resources',
              children: [
                {
                  title: 'Q&A',
                  directory: false,
                  path: '/resources/qa'
                },
                {
                  title: 'EVM ABI Docs',
                  path: 'https://docs.soliditylang.org/en/latest/abi-spec.html'
                },
              ]
            },
          ]
        }
      },
      '/zh/': {
        sidebar: {
          auto: false,
          nav: [
            {
              title: '参考',
              children: [
                {
                  title: '简介',
                  directory: false,
                  path: '/zh/reference/intro'
                },
                {
                  title: '术语介绍',
                  directory: false,
                  path: '/zh/reference/core'
                },
              ]
            },
            {
              title: 'Registry 合约',
              children: [
                {
                  title: '原理',
                  directory: false,
                  path: '/zh/registry/registry'
                },
                {
                  title: '部署合约',
                  directory: false,
                  path: '/zh/registry/deploy'
                },
                {
                  title: 'MVM 编码',
                  directory: false,
                  path: '/zh/registry/encoding'
                },
                {
                  title: '调用合约',
                  directory: false,
                  path: '/zh/registry/call'
                },
                {
                  title: 'memo 过长错误',
                  directory: false,
                  path: '/zh/registry/long_memo'
                },
                {
                  title: '错误定位',
                  directory: false,
                  path: '/zh/registry/debug'
                }
              ]
            },
            {
              title: "Bridge 合约",
              children: [
                {
                  title: "原理",
                  path: "/zh/bridge/intro"
                },
                {
                  title: "Bridge API 服务",
                  path: "/zh/bridge/api"
                },
                {
                  title: "跨链充值",
                  path: "/zh/bridge/deposit"
                },
                {
                  title: "跨链提现",
                  path: "/zh/bridge/withdrawal"
                },
              ]
            },
            {
              title: 'Storage 合约',
              children: [
                {
                  title: '原理与使用',
                  path: '/zh/storage/intro',
                },
              ]
            },
            {
              title: "MVM API 服务",
              children: [
                {
                  title: "简介",
                  path: "/zh/api/intro"
                },
                {
                  title: "使用 Storage",
                  path: "/zh/api/values"
                },
                {
                  title: "获取支付链接",
                  path: "/zh/api/payment"
                },
                {
                  title: "获取用户、资产与合约的映射",
                  path: "/zh/api/map"
                }
              ]
            },
            {
              title: 'RPC 接口',
              children: [
                {
                  title: 'MVM RPC 接口',
                  directory: false,
                  path: '/zh/rpc/intro'
                },
              ]
            },
            {
              title: 'ABI 规范',
              children: [
                {
                  title: '介绍',
                  directory: false,
                  path: '/zh/abi/intro'
                },
              ]
            },
            {
              title: 'Quorum',
              children: [
                {
                  title: '如何加入',
                  directory: false,
                  path: '/zh/quorum/join'
                },
              ]
            },
            {
              title: '资源',
              children: [
                {
                  title: '问答',
                  directory: false,
                  path: '/zh/resources/qa'
                },
                {
                  title: 'EVM ABI 文档',
                  path: 'https://docs.soliditylang.org/en/latest/abi-spec.html'
                },
              ]
            },
            // {
            //   title: '开发及部署',
            //   children: [
            //     {
            //       title: '部署 uniswap',
            //       directory: false,
            //       path: '/zh/guide/uniswap'
            //     },
            //     {
            //       title: '调用合约',
            //       directory: false,
            //       path: '/zh/guide/usage'
            //     },
            //     {
            //       title: 'MVM 编码',
            //       directory: false,
            //       path: '/zh/guide/encoding'
            //     },
            //   ]
            // },
          ]
        }
      },
    },
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom',
  ]
}