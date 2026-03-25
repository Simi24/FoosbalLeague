#!/usr/bin/env bash
# One-shot script to backfill changelog.json from existing CHANGELOG.md
# Usage: GOOGLE_AI_API_KEY=... bash .github/scripts/backfill-changelog.sh
#
# Requires: curl, jq
# Uses Google Gemini 2.0 Flash (free tier)

set -euo pipefail

CHANGELOG_FILE="CHANGELOG.md"
OUTPUT_FILE="frontend/public/changelog.json"
API_URL="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

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

while IFS= read -r line; do
  if [[ "$line" =~ ^##\ \[([0-9]+\.[0-9]+\.[0-9]+)\] ]]; then
    if [[ -n "$current_version" && -n "$current_content" ]]; then
      echo "Processing v${current_version}..."

      prompt="You are writing a changelog for end users of a foosball league app called FoosLeague. The users are non-technical office workers who play foosball.

Transform the developer changelog below into 2-5 bullet points that a regular user would understand and care about. Focus on what changed from the user's perspective (new features, improvements, fixes they'd notice). Skip purely internal/infrastructure changes. If a release is ALL infrastructure, return a single bullet: \"Behind-the-scenes improvements for reliability and performance.\"

Return ONLY a JSON object: {\"summary\": [\"bullet 1\", \"bullet 2\"]}
No markdown, no code fences, just the raw JSON.

=== CHANGELOG ENTRY ===
${current_content}"

      response=$(curl -s "${API_URL}?key=${GOOGLE_AI_API_KEY}" \
        -H "Content-Type: application/json" \
        -d "$(jq -n --arg prompt "$prompt" '{
          "contents": [{"parts": [{"text": $prompt}]}],
          "generationConfig": {"temperature": 0.3, "maxOutputTokens": 512}
        }')" 2>/dev/null || echo '{}')

      summary=$(echo "$response" | jq -r '.candidates[0].content.parts[0].text // empty' 2>/dev/null || echo "")
      summary=$(echo "$summary" | sed 's/^```json//;s/^```//' | tr -d '\n' | sed 's/```$//')

      if echo "$summary" | jq -e '.summary' > /dev/null 2>&1; then
        new_entry=$(jq -n \
          --arg version "$current_version" \
          --arg date "$current_date" \
          --argjson summary "$summary" \
          '{version: $version, date: $date, summary: $summary.summary}')
        entries=$(echo "$entries" | jq --argjson entry "$new_entry" '. + [$entry]')
      else
        echo "  Warning: Invalid LLM response for v${current_version}, using fallback"
        new_entry=$(jq -n \
          --arg version "$current_version" \
          --arg date "$current_date" \
          '{version: $version, date: $date, summary: ["Various improvements and bug fixes."]}')
        entries=$(echo "$entries" | jq --argjson entry "$new_entry" '. + [$entry]')
      fi

      sleep 1
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
  echo "Processing v${current_version}..."

  prompt="You are writing a changelog for end users of a foosball league app called FoosLeague. The users are non-technical office workers who play foosball.

Transform the developer changelog below into 2-5 bullet points that a regular user would understand and care about. Focus on what changed from the user's perspective (new features, improvements, fixes they'd notice). Skip purely internal/infrastructure changes. If a release is ALL infrastructure, return a single bullet: \"Behind-the-scenes improvements for reliability and performance.\"

Return ONLY a JSON object: {\"summary\": [\"bullet 1\", \"bullet 2\"]}
No markdown, no code fences, just the raw JSON.

=== CHANGELOG ENTRY ===
${current_content}"

  response=$(curl -s "${API_URL}?key=${GOOGLE_AI_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg prompt "$prompt" '{
      "contents": [{"parts": [{"text": $prompt}]}],
      "generationConfig": {"temperature": 0.3, "maxOutputTokens": 512}
    }')" 2>/dev/null || echo '{}')

  summary=$(echo "$response" | jq -r '.candidates[0].content.parts[0].text // empty' 2>/dev/null || echo "")
  summary=$(echo "$summary" | sed 's/^```json//;s/^```//' | tr -d '\n' | sed 's/```$//')

  if echo "$summary" | jq -e '.summary' > /dev/null 2>&1; then
    new_entry=$(jq -n \
      --arg version "$current_version" \
      --arg date "$current_date" \
      --argjson summary "$summary" \
      '{version: $version, date: $date, summary: $summary.summary}')
    entries=$(echo "$entries" | jq --argjson entry "$new_entry" '. + [$entry]')
  else
    echo "  Warning: Invalid LLM response for v${current_version}, using fallback"
    new_entry=$(jq -n \
      --arg version "$current_version" \
      --arg date "$current_date" \
      '{version: $version, date: $date, summary: ["Various improvements and bug fixes."]}')
    entries=$(echo "$entries" | jq --argjson entry "$new_entry" '. + [$entry]')
  fi
fi

echo "$entries" | jq '.' > "$OUTPUT_FILE"
count=$(echo "$entries" | jq 'length')
echo "Done! Generated $count entries in $OUTPUT_FILE"
