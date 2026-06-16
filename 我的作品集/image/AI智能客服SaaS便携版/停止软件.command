#!/bin/zsh
set -e

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$BASE_DIR/.server.pid"
PORT_FILE="$BASE_DIR/.server.port"

if [ ! -f "$PID_FILE" ]; then
  osascript -e 'display dialog "当前没有发现正在运行的服务。" buttons {"确定"} default button "确定"'
  exit 0
fi

PID="$(cat "$PID_FILE" 2>/dev/null || true)"
if [ -n "$PID" ] && kill -0 "$PID" >/dev/null 2>&1; then
  kill "$PID"
  rm -f "$PID_FILE" "$PORT_FILE"
  osascript -e 'display dialog "AI智能客服SaaS 已停止。" buttons {"确定"} default button "确定"'
else
  rm -f "$PID_FILE" "$PORT_FILE"
  osascript -e 'display dialog "服务进程已不存在，已清理状态文件。" buttons {"确定"} default button "确定"'
fi
