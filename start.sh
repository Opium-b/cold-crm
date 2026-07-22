#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Cold CRM ni LOKAL WiFi tarmoqda ishga tushiradi. Bitta WiFi'dagi barcha
# qurilmalar (kompyuter, telefon) ochib ishlata oladi.
#
# Ishlatish:
#   bash start.sh            # oddiy
#   bash start.sh --build    # .env.local (parol) o'zgargan bo'lsa
#
# To'xtatish: Ctrl+C
# -----------------------------------------------------------------------------
set -e
cd "$(dirname "$0")"

PORT="${PORT:-3000}"

# LAN IP manzilini avtomatik aniqlash (WiFi/Ethernet)
LAN_IP="$(ip route get 1.1.1.1 2>/dev/null | grep -oE 'src [0-9.]+' | awk '{print $2}')"
[ -z "$LAN_IP" ] && LAN_IP="localhost"

# Build. Middleware paroli build vaqtida olinadi — .env.local o'zgarsa "--build".
if [ ! -f ".next/BUILD_ID" ] || [ "$1" = "--build" ]; then
  echo "==> Build qilinmoqda (biroz vaqt oladi)..."
  npm run build
fi

echo ""
echo "==================================================================="
echo "  Cold CRM ishga tushmoqda."
echo ""
echo "  Bu kompyuterda:   http://localhost:$PORT"
echo "  Telefon/boshqa:   http://$LAN_IP:$PORT   <-- shu WiFi'dagi qurilmalar"
echo ""
echo "  Parol: .env.local -> APP_PASSWORD"
echo "  (Telefonda albatta http:// bilan yozing, https EMAS)"
echo "==================================================================="
echo ""

# -H 0.0.0.0 => barcha tarmoq interfeyslarida tinglaydi (LAN'dan ko'rinadi)
exec npx next start -H 0.0.0.0 -p "$PORT"
