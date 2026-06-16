#!/bin/zsh
set -e

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$BASE_DIR/app"
PID_FILE="$BASE_DIR/.server.pid"
PORT_FILE="$BASE_DIR/.server.port"

if [ ! -d "$APP_DIR" ]; then
  osascript -e 'display dialog "未找到 app 文件夹，软件文件可能不完整。" buttons {"确定"} default button "确定"'
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  osascript -e 'display dialog "当前电脑未安装 python3，无法启动本地服务。" buttons {"确定"} default button "确定"'
  exit 1
fi

if [ -f "$PID_FILE" ]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" >/dev/null 2>&1; then
    OLD_PORT="$(cat "$PORT_FILE" 2>/dev/null || echo 8765)"
    open "http://127.0.0.1:$OLD_PORT"
    echo "软件已经在运行，已重新打开浏览器：http://127.0.0.1:$OLD_PORT"
    exit 0
  fi
fi

PORT=8765
while lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

cd "$APP_DIR"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/ai-customer-service-portable.log 2>&1 &
SERVER_PID=$!

echo "$SERVER_PID" > "$PID_FILE"
echo "$PORT" > "$PORT_FILE"

sleep 1
open "http://127.0.0.1:$PORT"

echo "AI智能客服SaaS 已启动"
echo "访问地址：http://127.0.0.1:$PORT"
echo "服务进程：$SERVER_PID"
echo ""
echo "可以关闭浏览器后继续使用，也可以双击“停止软件.command”停止本地服务。"
