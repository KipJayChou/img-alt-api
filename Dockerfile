# 使用 Deno 官方轻量版镜像
FROM denoland/deno:alpine

# 设置工作目录
WORKDIR /app

# 把 /app 目录的所有权赋给 deno 用户，确保它能在里面生成 lock 文件
RUN chown -R deno:deno /app

# 切换到非 root 用户以增强安全性
USER deno

# 使用 --chown 标志拷贝所有源代码，确保文件也是 deno 用户的
COPY --chown=deno:deno . .

# 预缓存项目依赖（加快启动速度）
RUN deno cache main.js

# 暴露 Hono 默认端口
EXPOSE 8000

# 启动命令
CMD ["run", "--allow-net", "--allow-read", "--allow-env", "main.js"]
