#!/usr/bin/env bash
# Fetch the GitHub team roster into data/editors.json for Hugo rendering.
# Requires: GH_TOKEN with read:org, jq, curl.

set -euo pipefail

ORG="${ORG:-genomicsxai}"
TEAM="${TEAM:-editors}"
OUT="${OUT:-data/editors.json}"
TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"

mkdir -p "$(dirname "$OUT")"

if [ -z "$TOKEN" ]; then
  echo '[]' > "$OUT"
  echo "No GH_TOKEN or GITHUB_TOKEN set; editorial board will be empty."
  exit 0
fi

PAGE=1
ALL=""

while true; do
  RES=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/orgs/${ORG}/teams/${TEAM}/members?per_page=100&page=${PAGE}")
  CODE=$(echo "$RES" | tail -n1)
  BODY=$(echo "$RES" | sed '$d')

  if [ "$CODE" != "200" ]; then
    echo "GitHub API returned $CODE; writing empty editors list."
    echo '[]' > "$OUT"
    exit 0
  fi

  COUNT=$(echo "$BODY" | jq -r 'length')
  [ "$COUNT" -eq 0 ] && break

  if [ -z "$ALL" ]; then
    ALL="$BODY"
  else
    ALL=$(printf '%s\n%s' "$ALL" "$BODY" | jq -s 'add')
  fi

  [ "$COUNT" -lt 100 ] && break
  PAGE=$((PAGE + 1))
done

OUT_JSON="[]"
for login in $(echo "$ALL" | jq -r '.[].login'); do
  USER=$(curl -s \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/users/${login}")
  NAME=$(echo "$USER" | jq -r '.name // empty')
  URL=$(echo "$USER" | jq -r '.html_url // empty')
  [ -z "$URL" ] && URL="https://github.com/${login}"
  ENTRY=$(jq -nc --arg login "$login" --arg url "$URL" --arg name "$NAME" \
    '{login: $login, url: $url, name: (if $name == "" then null else $name end)}')
  OUT_JSON=$(echo "$OUT_JSON" "$ENTRY" | jq -s '.[0] + [.[1]]')
done

echo "$OUT_JSON" > "$OUT"
echo "Fetched $(jq length "$OUT") editor(s) into $OUT."
