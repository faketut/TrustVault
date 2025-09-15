# Sex Consent Contract Management System
## 性同意合同管理系统

## 一、项目介绍
性同意合同管理系统是一个专门用于管理性同意合同的数字化平台，旨在通过技术手段确保性同意过程的透明性、可追溯性和法律有效性。系统采用现代化的前后端分离架构，提供安全、隐私保护的性同意合同创建、签署、管理和撤销功能。

**重要提醒：本系统仅用于技术学习和研究目的，实际应用需要符合当地法律法规要求，并建议咨询专业法律人士。**

## 二、技术架构
### 2.1 技术架构
系统采用前后端分离架构开发，前端采用React + TypeScript，后端采用Node.js + Express + MongoDB(cloud)。详细的技术架构如下图所示：

```
Sex Consent App Architecture
├─Frontend (React + TypeScript)
│  ├─Form Creation Interface
│  ├─Contract Signing Interface  
│  ├─Privacy Management
│  └─Mobile QR Code Scanner
├─Backend (Node.js + Express)
│  ├─RESTful API
│  ├─JWT Authentication
│  ├─MongoDB Database
│  └─QR Code Generation
└─Database (MongoDB)
   ├─Users Collection
   └─ConsentContracts Collection
```

### 2.2 开发语言与组件
- **前端开发**：React 18 + TypeScript + Material-UI
- **后端开发**：Node.js + Express + MongoDB
- **数据库**：MongoDB
- **认证**：JWT (JSON Web Tokens) + 多平台登录
- **QR码生成**：qrcode.js
- **密码加密**：bcryptjs
- **短信服务**：可配置的SMS服务提供商

### 2.3 认证方式
系统支持多种认证方式，确保用户可以选择最适合的登录方法：

#### 2.3.1 微信登录 (WeChat Login)
- 集成微信OAuth2.0认证
- 支持微信小程序和网页版登录
- 自动获取用户基本信息（昵称、头像等）
- 支持微信UnionID跨平台识别

#### 2.3.2 苹果登录 (Apple Sign-In)
- 集成Apple Sign-In SDK
- 支持隐私保护的用户信息获取
- 自动生成用户头像
- 支持隐藏邮箱地址功能

#### 2.3.3 手机号登录 (Phone Number Login)
- 支持国际手机号格式
- SMS短信验证码认证
- 5分钟验证码有效期
- 防暴力破解机制（最多3次尝试）
- 可配置的SMS服务提供商

#### 2.3.4 社交登录 (Social Login)
- 支持QQ、微博等社交平台
- 手动输入社交账号信息
- 兼容现有用户数据

### 2.4 代码模块
```
sex-consent-app/
├─server.js                 # 后端API服务器
├─package.json              # 项目依赖配置
├─env.example               # 环境变量示例
├─client/                   # React前端应用
│  ├─src/
│  │  ├─components/         # React组件
│  │  ├─pages/             # 页面组件
│  │  ├─services/          # API服务
│  │  └─utils/             # 工具函数
│  └─public/               # 静态资源
└─README.md                # 项目说明文档
```

## 三、功能模块
### 3.1 核心功能
#### 1. 用户管理
- **多种注册方式**：支持微信、社交媒体账户、邮箱注册
- 用户注册与登录
- 角色管理（用户、管理员、律师）
- 隐私状态设置
- 用户统计信息

#### 2. 性同意表单管理
- 创建自定义性同意表单
- 表单字段配置（文本、选择、日期等）
- 表单版本管理
- 表单模板库

#### 3. 性同意合同管理
- 创建性同意合同
- 二维码分享签署
- 双方异步签署
- 二次确认签署（行为后签署）
- 合同状态跟踪

#### 4. 隐私与安全
- 用户隐私状态控制
- 合同访问日志
- 数据加密存储
- 安全认证机制

#### 5. 法律支持
- 律师标注功能
- 合同审查工具
- 法律建议记录
- 合同有效性管理

### 3.2 业务流程
#### 创建性同意合同流程
1. **管理员注册**：管理员需要先注册账户才能创建表单模板
   - 支持微信扫码注册
   - 支持社交媒体账户注册（Google、Facebook等）
   - 支持邮箱注册
2. **创建表单**：管理员登录后创建性同意表单模板
3. **邀请签署**：用户A创建合同并邀请用户B
4. **生成二维码**：系统生成二维码供用户B扫描
5. **匿名签署**：用户B登陆后可通过二维码直接签署
6. **双方签署**：双方通过移动端或网页端签署合同
7. **系统记录**：系统记录签署时间和IP地址
8. **合同生效**：合同生效

#### 后续管理流
2. **撤销同意**：注册用户可随时撤销同意
3. **律师标注**：律师可对合同进行标注
4. **统计更新**：系统自动更新用户统计
5. **历史查询**：注册用户可查询

#### 注册方式详解
1. **微信注册**
   - 扫码快速注册
   - 自动获取微信用户信息
   - 无需设置密码

2. **社交媒体注册**
   - 支持Google、Facebook、Twitter等
   - 一键登录，快速便捷
   - 安全的数据传输

3. **邮箱注册**
   - 传统邮箱注册方式
   - 邮箱验证确保真实性
   - 支持密码找回功能

## 四、安装部署
### 4.1 环境要求
- Node.js >= 14.0.0
- MongoDB >= 4.0
- npm >= 6.0.0

### 4.2 安装步骤
```bash
# 1. 克隆项目
git clone <repository-url>
cd sex-consent-app

# 2. 安装后端依赖
npm install

# 3. 配置环境变量
cp env.example .env
# 编辑 .env 文件，设置数据库连接和JWT密钥

# 4. 启动MongoDB服务
# 确保MongoDB服务正在运行

# 5. 启动后端服务
npm start

# 6. 安装前端依赖（在另一个终端）
cd client
npm install
npm start
```

### 4.3 环境变量配置
```env
# 基础配置
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost/sex-consent-system
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
CLIENT_URL=http://localhost:3001

# 微信登录配置
WECHAT_APPID=your-wechat-appid
WECHAT_APPSECRET=your-wechat-appsecret
WECHAT_JSAPI_TICKET=your-wechat-jsapi-ticket

# 苹果登录配置
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key

# SMS服务配置 (选择一种)
# Twilio配置
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# AWS SNS配置
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# 其他SMS服务提供商配置
SMS_PROVIDER=twilio  # 或 aws, sendgrid, messagebird 等
```

## 五、API接口文档
### 5.1 用户认证（多平台登录）
#### 5.1.1 微信登录
- `POST /api/auth/wechat/callback` - 微信OAuth2.0回调
- `POST /api/auth/wechat/refresh-token` - 刷新微信访问令牌
- `POST /api/auth/wechat/signature` - 获取微信JS-SDK签名

#### 5.1.2 苹果登录
- `POST /api/auth/apple/login` - 苹果Sign-In登录

#### 5.1.3 手机号登录
- `POST /api/auth/phone/send-code` - 发送短信验证码
- `POST /api/auth/phone/verify` - 验证短信验证码并登录

#### 5.1.4 社交登录
- `POST /api/auth/social-login` - 社交媒体登录（QQ、微博等）

#### 5.1.5 用户管理
- `GET /api/auth/profile` - 获取用户资料
- `PUT /api/auth/profile` - 更新用户资料
- `GET /api/auth/stats` - 获取用户统计信息

### 5.2 合同管理
- `POST /api/consent-contracts/:id/sign` - 签署合同（支持匿名）
- `GET /api/consent-contracts/:id/status` - 查看合同状态

- `POST /api/consent-contracts` - 创建性同意合同
- `POST /api/consent-contracts/:id/revoke` - 撤销合同
- `GET /api/consent-contracts/my-contracts` - 获取用户合同列表
- `GET /api/consent-contracts/:id/download` - 下载合同

- `POST /api/consent-contracts/:id/annotate` - 添加律师标注

## 六、安全与隐私
### 6.1 数据保护
- 所有密码使用bcrypt加密存储
- JWT令牌用于身份验证
- 支持多种登录方式（微信、社交媒体、邮箱）
- 敏感数据访问需要权限验证
- 支持用户隐私状态设置
- 第三方登录数据安全处理

### 6.2 法律合规
- 系统记录所有操作日志
- 支持合同撤销和律师审查
- 提供数据导出功能
- 符合数据保护法规要求

## 七、开发指南
### 7.1 开发环境设置
```bash
# 激活conda环境
conda activate sex-consent-app

# 安装Node.js（如果未安装）
conda install nodejs -c conda-forge

# 启动开发服务器
npm run dev
```

### 7.2 代码结构
- 后端API遵循RESTful设计原则
- 前端采用组件化开发模式
- 数据库使用MongoDB文档存储
- 支持TypeScript类型检查

## 八、贡献指南
欢迎提交Issue和Pull Request来改进项目。在贡献代码前，请确保：
1. 代码符合项目规范
2. 添加必要的测试
3. 更新相关文档
4. 遵循隐私保护原则

## 九、许可证
本项目采用MIT许可证，详见LICENSE文件。

## 十、免责声明
本系统仅供学习和研究使用，不构成法律建议。在实际应用中，请确保符合当地法律法规，并咨询专业法律人士。