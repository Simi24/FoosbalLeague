#!/usr/bin/env bash
# One-shot script to backfill changelog.json from existing CHANGELOG.md
# Usage: GOOGLE_AI_API_KEY=... bash .github/scripts/backfill-changelog.sh
#
# Requires: curl, jq
# Uses Google Gemini Flash (free tier)

set -euo pipefail

CHANGELOG_FILE="CHANGELOG.md"
OUTPUT_FILE="frontend/public/changelog.json"
API_URL="https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"

if [[ -z "${GOOGLE_AI_API_KEY:-}" ]]; then
  echo "Error: GOOGLE_AI_API_KEY is required"
  exit 1
fi

if [[ ! -f "$CHANGELOG_FILE" ]]; then
  echo "Error: $CHANGELOG_FILE not found"
  exit 1
fi

echo "Parsing $CHANGELOG_FILE..."

entries="[]"
current_version=""
current_date=""
current_content=""

call_gemini() {
  local version="$1"
  local date="$2"
  local content="$3"

  echo "Processing v${version}..."

  # Build prompt via file for safe escaping
  cat > /tmp/bp-prompt.txt <<'PROMPT_END'
You are writing a changelog for end users of a foosball league app called FoosLeague. The users are non-technical office workers who play foosball.

Transform the developer changelog below into 2-5 bullet points that a regular user would understand and care about. Focus on what changed from the user's perspective (new features, improvements, fixes they'd notice). Skip purely internal/infrastructure changes. If a release is ALL infrastructure, return a single bullet: "Behind-the-scenes improvements for reliability and performance."

Return ONLY a JSON object: {"summary": ["bullet 1", "bullet 2"]}
No markdown, no code fences, just the raw JSON.

=== CHANGELOG ENTRY ===
PROMPT_END

  echo "$content" >> /tmp/bp-prompt.txt

  jq -n --rawfile prompt /tmp/bp-prompt.txt '{
    "contents": [{"parts": [{"text": $prompt}]}],
    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 512}
  }' > /tmp/bp-payload.json

  local http_code
  http_code=$(curl -s -o /tmp/bp-response.json -w "%{http_code}" \
    "$API_URL" \
    -H "Content-Type: application/json" \
    -H "X-goog-api-key: ${GOOGLE_AI_API_KEY}" \
    -d @/tmp/bp-payload.json)

  if [[ "$http_code" != "200" ]]; then
    echo "  Warning: API returned HTTP ${http_code}"
    echo "$version"
    return 1
  fi

  local summary
  summary=$(jq -r '.candidates[0].content.parts[0].text // empty' /tmp/bp-response.json)
  summary=$(echo "$summary" | sed 's/^```json//' | sed 's/^```//' | sed 's/```$//' | tr '\n' ' ' | xargs)

  if echo "$summary" | jq -e '.summary' > /dev/null 2>&1; then
    local new_entry
    new_entry=$(jq -n \
      --arg version "$version" \
      --arg date "$date" \
      --argjson summary "$summary" \
      '{version: $version, date: $date, summary: $summary.summary}')
    entries=$(echo "$entries" | jq --argjson entry "$new_entry" '. + [$entry]')
    echo "  OK"
  else
    echo "  Warning: Invalid LLM response, using fallback"
    local new_entry
    new_entry=$(jq -n \
      --arg version "$version" \
      --arg date "$date" \
      '{version: $version, date: $date, summary: ["Various improvements and bug fixes."]}')
    entries=$(echo "$entries" | jq --argjson entry "$new_entry" '. + [$entry]')
  fi
}

while IFS= read -r line; do
  if [[ "$line" =~ ^##\ \[([0-9]+\.[0-9]+\.[0-9]+)\] ]]; then
    if [[ -n "$current_version" && -n "$current_content" ]]; then
      call_gemini "$current_version" "$current_date" "$current_content"
      sleep 2
    fi

    current_version="${BASH_REMATCH[1]}"
    current_date=$(echo "$line" | grep -oP '\(\K[0-9-]+' || echo "")
    current_content="$line"
  elif [[ -n "$current_version" ]]; then
    current_content="${current_content}
${line}"
  fi
done < "$CHANGELOG_FILE"

# Process last section
if [[ -n "$current_version" && -n "$current_content" ]]; then
  call_gemini "$current_version" "$current_date" "$current_content"
fi

echo "$entries" | jq '.' > "$OUTPUT_FILE"
count=$(echo "$entries" | jq 'length')
echo "Done! Generated $count entries in $OUTPUT_FILE"
