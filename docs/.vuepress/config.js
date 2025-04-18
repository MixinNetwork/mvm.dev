module.exports = {
  themeConfig: {
    repo: "vuejs/vuepress",
    editLinks: true,
    docsDir: "packages/docs/docs",
    sidebar: [
      '/',
      ['/operation/register', '注册用户'],
      ['/operation/call', '发起 Solana 交易'],
    ]
  },
  title: 'Mixin Safe Computer 教程',
  description: "A chinese tutorial for Mixin Safe Computer"
}