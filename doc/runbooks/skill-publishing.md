# Skill 发布、预览和获取：当前范围

当前源码的随机数包版本为 1.2.0：脚本通过用户本地 connection.json 加载 User 共享客户端，
支持 --check、默认恢复/复用结果的 --invoke，以及明确另起交易的 --force。发布前须先提供包含客户端的 User 版本，再重新
审核发布新 ZIP；不能覆盖任何已发布版本 或自动替换用户正在使用的包。Harness 验收待完成。

本页供 Skill 发布者阅读。发布者可以与 Provider 不同。Market 保存列表与包，
Provider 自己登记付费服务并获得接单资格；**发布不是接单资格的前置条件，
也不会替 Provider 修改收款、价格或 Registry 资格**。

## 当前源码路径与部署边界

1. 从 Provider 获取本服务的 ZIP（当前源码版本 1.2.0），检查不含私钥、凭证、
   私有配置或业务数据。包应包含一个 SKILL.md 和同目录的 agentpay.json。
2. 登录 Market 页面，在 Publish a Skill 上传 ZIP、填写介绍、保存草稿并上传图片。
   Provider 引用可留空或填写多个；无需完成端点所有权挑战。
3. 打开独立预览页查看发布后的布局，然后选择 Publish Skill。Market 自动执行文件
   查毒和包指令安全检查，并审核介绍、图片的基础合规、真实性和隐私；无需先点检查。
   ZIP 会提交给 VirusTotal 社区，文本和图片会发给平台模型；不可提交保密内容。
   通过才自动发布；待人工、拒绝或临时失败保留草稿，可在 Your Skills 查看。
4. 发布完成后查看公开页面和下载原始 ZIP。改变内容必须使用新版本，不能覆盖旧字节。
   安装方式以包内 SKILL.md 和当前 User 引导为准；1.2.0 需要支持输入快照、输出文件缓存及原请求恢复的 User 共享客户端。

Market 统一审核和官方付费调用已有私有演练记录。发布者仍需核对自己服务生成的 ZIP、客户端要求和实际部署；其他服务或旧版本的验证不能替代本次发布检查。
更新已发布 Skill 时保存草稿不影响旧公开版本。成功发布后会清理临时草稿文件，
正式版本独立保留 ZIP、介绍、图片以及审核与重试记录。
发布与 Registry/支付资格互不替代，检查通过也不保证服务质量或绝对安全。

## 接入完成后先取得本服务的完整包

当前终端的下一步是查看自己服务生成的包，随后再按上方当前发布流程上传 Market。
查看引导 details 中的 endpoint origin 和 service name；自己的服务器提供：
`/services/<serviceId>/agentpay/skill-bundle.zip`。
例如 endpoint origin 为 `https://service.example`、service name 为 `random`：

```bash
curl --fail --show-error --location --output agentpay-random-1.2.0.zip https://service.example/services/random/agentpay/skill-bundle.zip
sha256sum agentpay-random-1.2.0.zip
unzip -l agentpay-random-1.2.0.zip
```

把 URL 换成自己的地址；本步骤只获取/查看包，不执行包内脚本，也不产生订单。
应包含 SKILL.md、agentpay.json 与脚本，不应包含凭证、私有配置或数据库密码。
运行中的 Provider 只有在加载新源码后才会提供新包；下载后应核对包内版本。也可使用维护者按相同已注册服务引用生成的新版本 ZIP。

## 1.2.0 缓存接入范围

随机数仍只接收 min/max JSON 并返回 JSON；输入/输出文件声明为空。
共享 User 客户端负责输入快照、验证后的结果保存和原请求恢复，不在 Skill
脚本中重复实现。`--invoke <min> <max>`、`--check`、`--quote`、`--resume`
及显式新请求 `--force` 保持不变。缺少客户端能力会在调用前停止并提示更新。
服务身份、报价、收款及 Provider 业务逻辑不因包升级而改变。
