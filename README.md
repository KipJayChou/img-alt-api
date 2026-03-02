# img-alt-api (Gemini Edition)

这是一个简单的 API 接口，用于自动生成图片的替代文本（Alt Text）描述。现已升级为由 **Google Gemini API** 驱动，支持详细的中英双语描述。

灵感来源于 [Ice Cubes](https://github.com/Dimillian/IceCubesApp)。

- 基于 [Deno](https://deno.com/) 编写。
- 采用 [Hono](https://hono.dev/) 框架。
- 使用 [Google Gemini 1.5/2.5/3.1 Flash](https://aistudio.google.com/) 模型。
- **支持中英双语 (Bilingual)** 详细描述。
- 支持 Docker 容器化部署与 Caddy 反向代理。

## 特性

- **智能识别**：利用 Gemini 的多模态能力提供极高准确度的图片分析。
- **双语输出**：默认同时返回英文和中文描述，方便国际化社交网络使用。
- **极低成本**：使用 Flash 系列模型，每万次调用成本极低。

## 本地开发

需要安装 [Deno](https://deno.com/)。

在根目录创建 `.env` 文件并添加以下变量：

```env
GEMINI_API_KEY=你的_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash

```

运行命令：

* `deno task dev` - 开发模式（支持热重载）。
* `deno task start` - 生产模式运行。

## Docker 部署

项目已完整配置 Dockerfile，支持一键部署：

```bash
docker compose up -d --build

```

### 配合 Caddy 使用

如果你使用 Caddy 容器，可以在 `docker-compose.yml` 中使用以下标签实现自动代理：

```yaml
labels:
  caddy: img-alt.moe.pub
  caddy.reverse_proxy: "{{upstreams 8000}}"

```

## REST API 接口

### 生成描述

* **GET** `/?image=<image-url>`
* **POST** `/` (使用 `multipart/form-data` 上传图片文件，Key 为 `image`)

### 响应示例

```json
{
  "description": "English: A high-resolution photo of a ginger tabby cat... \nChinese: 一张姜黄色虎斑猫的高清特写照片..."
}

```

### 错误响应

```json
{
  "error": "错误信息详情"
}

```

## 许可证

[MIT](https://cheeaun.mit-license.org/).

## 参考

* https://github.com/cheeaun/img-alt-api
* https://aistudio.google.com/
