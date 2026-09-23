#!/usr/bin/env bash
set -euo pipefail

# IndexNow Instant Search Engine Indexing Dispatcher
# Submits URLs to Microsoft Bing, Yandex, Seznam, and partner engines in real-time.

HOST="www.lumiina.art"
KEY="e479a9528646452292f9d554a7f92e91"
KEY_LOCATION="https://www.lumiina.art/e479a9528646452292f9d554a7f92e91.txt"

PAYLOAD=$(cat <<EOF
{
  "host": "${HOST}",
  "key": "${KEY}",
  "keyLocation": "${KEY_LOCATION}",
  "urlList": [
    "https://${HOST}/",
    "https://${HOST}/explore",
    "https://${HOST}/trending",
    "https://${HOST}/recommended",
    "https://${HOST}/about",
    "https://${HOST}/guidelines",
    "https://${HOST}/terms",
    "https://${HOST}/privacy",
    "https://${HOST}/?tag=GenshinImpact",
    "https://${HOST}/?tag=Frieren",
    "https://${HOST}/?tag=BokuNoHeroAcademia",
    "https://${HOST}/?tag=FanArt",
    "https://${HOST}/?tag=ConceptArt",
    "https://${HOST}/profile/Nyanns"
  ]
}
EOF
)

echo "📡 Dispatching IndexNow submission to https://api.indexnow.org/indexnow..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "${PAYLOAD}" \
  "https://api.indexnow.org/indexnow")

echo "IndexNow HTTP Response: ${HTTP_CODE}"
if [ "${HTTP_CODE}" -eq 200 ] || [ "${HTTP_CODE}" -eq 202 ]; then
  echo "✅ Success! Search engines (Bing, Yandex, Seznam, Naver) notified immediately."
else
  echo "⚠️ Notice: IndexNow returned code ${HTTP_CODE}. Check key verification location."
fi
