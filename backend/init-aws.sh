#!/bin/bash

export AWS_DEFAULT_REGION=eu-west-1

echo "============================================"
echo "  Foosball League - LocalStack Init"
echo "============================================"

# --------------------------------------------------
# DynamoDB Table
# --------------------------------------------------

awslocal dynamodb create-table \
    --table-name foosball-league \
    --attribute-definitions \
        AttributeName=pk,AttributeType=S \
        AttributeName=sk,AttributeType=S \
        AttributeName=gsi1_pk,AttributeType=S \
        AttributeName=gsi1_sk,AttributeType=S \
        AttributeName=gsi3_pk,AttributeType=S \
        AttributeName=gsi3_sk,AttributeType=S \
    --key-schema \
        AttributeName=pk,KeyType=HASH \
        AttributeName=sk,KeyType=RANGE \
    --global-secondary-indexes \
        '[
            {
                "IndexName": "GSI1",
                "KeySchema": [
                    {"AttributeName": "gsi1_pk", "KeyType": "HASH"},
                    {"AttributeName": "gsi1_sk", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            },
            {
                "IndexName": "GSI3",
                "KeySchema": [
                    {"AttributeName": "gsi3_pk", "KeyType": "HASH"},
                    {"AttributeName": "gsi3_sk", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ]' \
    --billing-mode PAY_PER_REQUEST

echo "[OK] DynamoDB table created"

# --------------------------------------------------
# Constants
# --------------------------------------------------

TENANT="TENANT#default"
NOW="2026-03-01T12:00:00Z"
INVITE_CODE="FOOS42"

# --------------------------------------------------
# Tenant
# --------------------------------------------------

awslocal dynamodb put-item \
    --table-name foosball-league \
    --item '{
        "pk": {"S": "TENANT#default"},
        "sk": {"S": "METADATA"},
        "entity_type": {"S": "TENANT"},
        "tenant_id": {"S": "default"},
        "name": {"S": "Office Foosball"},
        "created_at": {"S": "2026-01-01T00:00:00Z"},
        "updated_at": {"S": "2026-01-01T00:00:00Z"}
    }'

echo "[OK] Tenant seeded"

# --------------------------------------------------
# Players (4 bots - your player is created at login)
# --------------------------------------------------

declare -A PLAYERS
PLAYERS[001]="Marco Rossi:marco@foosball.local"
PLAYERS[002]="Luca Bianchi:luca@foosball.local"
PLAYERS[003]="Giulia Verdi:giulia@foosball.local"
PLAYERS[004]="Chiara Neri:chiara@foosball.local"

for ID in 001 002 003 004; do
    IFS=':' read -r DNAME EMAIL <<< "${PLAYERS[$ID]}"
    awslocal dynamodb put-item \
        --table-name foosball-league \
        --item "{
            \"pk\": {\"S\": \"$TENANT\"},
            \"sk\": {\"S\": \"PLAYER#player-$ID\"},
            \"entity_type\": {\"S\": \"PLAYER\"},
            \"player_id\": {\"S\": \"player-$ID\"},
            \"cognito_sub\": {\"S\": \"bot-sub-$ID\"},
            \"display_name\": {\"S\": \"$DNAME\"},
            \"email\": {\"S\": \"$EMAIL\"},
            \"total_matches\": {\"N\": \"0\"},
            \"total_wins\": {\"N\": \"0\"},
            \"total_losses\": {\"N\": \"0\"},
            \"gsi3_pk\": {\"S\": \"$EMAIL\"},
            \"gsi3_sk\": {\"S\": \"PLAYER#player-$ID\"},
            \"created_at\": {\"S\": \"$NOW\"},
            \"updated_at\": {\"S\": \"$NOW\"}
        }"
done

echo "[OK] 4 players seeded"

# --------------------------------------------------
# League
# --------------------------------------------------

awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"LEAGUE#league-001\"},
        \"entity_type\": {\"S\": \"LEAGUE\"},
        \"league_id\": {\"S\": \"league-001\"},
        \"name\": {\"S\": \"Office Champions 2v2\"},
        \"league_type\": {\"S\": \"2v2\"},
        \"initial_elo\": {\"N\": \"1200\"},
        \"description\": {\"S\": \"La lega ufficiale del biliardino\"},
        \"created_by\": {\"S\": \"player-001\"},
        \"invite_code\": {\"S\": \"$INVITE_CODE\"},
        \"member_count\": {\"N\": \"4\"},
        \"match_count\": {\"N\": \"4\"},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"LEAGUE#league-001\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

echo "[OK] League seeded (invite code: $INVITE_CODE)"

# --------------------------------------------------
# Enrollments
# --------------------------------------------------

declare -A DNAMES
DNAMES[001]="Marco Rossi"
DNAMES[002]="Luca Bianchi"
DNAMES[003]="Giulia Verdi"
DNAMES[004]="Chiara Neri"

for ID in 001 002 003 004; do
    ROLE="player"
    if [ "$ID" = "001" ]; then ROLE="admin"; fi

    awslocal dynamodb put-item \
        --table-name foosball-league \
        --item "{
            \"pk\": {\"S\": \"$TENANT\"},
            \"sk\": {\"S\": \"ENROLL#league-001#player-$ID\"},
            \"entity_type\": {\"S\": \"ENROLLMENT\"},
            \"league_id\": {\"S\": \"league-001\"},
            \"player_id\": {\"S\": \"player-$ID\"},
            \"display_name\": {\"S\": \"${DNAMES[$ID]}\"},
            \"role\": {\"S\": \"$ROLE\"},
            \"current_elo\": {\"N\": \"1200\"},
            \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
            \"gsi1_sk\": {\"S\": \"ENROLL#player-$ID\"},
            \"created_at\": {\"S\": \"$NOW\"},
            \"updated_at\": {\"S\": \"$NOW\"}
        }"
done

echo "[OK] Enrollments seeded"

# --------------------------------------------------
# Ratings
# --------------------------------------------------

declare -A ELOS WINS LOSSES PLAYED
ELOS[001]=1280; WINS[001]=4; LOSSES[001]=2; PLAYED[001]=6
ELOS[002]=1220; WINS[002]=3; LOSSES[002]=3; PLAYED[002]=6
ELOS[003]=1140; WINS[003]=1; LOSSES[003]=3; PLAYED[003]=4
ELOS[004]=1160; WINS[004]=2; LOSSES[004]=2; PLAYED[004]=4

for ID in 001 002 003 004; do
    INV_ELO=$(printf "%04d" $((9999 - ${ELOS[$ID]})))
    awslocal dynamodb put-item \
        --table-name foosball-league \
        --item "{
            \"pk\": {\"S\": \"$TENANT\"},
            \"sk\": {\"S\": \"RATING#league-001#player-$ID\"},
            \"entity_type\": {\"S\": \"RATING\"},
            \"league_id\": {\"S\": \"league-001\"},
            \"player_id\": {\"S\": \"player-$ID\"},
            \"display_name\": {\"S\": \"${DNAMES[$ID]}\"},
            \"elo\": {\"N\": \"${ELOS[$ID]}\"},
            \"matches_played\": {\"N\": \"${PLAYED[$ID]}\"},
            \"wins\": {\"N\": \"${WINS[$ID]}\"},
            \"losses\": {\"N\": \"${LOSSES[$ID]}\"},
            \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
            \"gsi1_sk\": {\"S\": \"RATING#${INV_ELO}#player-$ID\"},
            \"created_at\": {\"S\": \"$NOW\"},
            \"updated_at\": {\"S\": \"$NOW\"}
        }"
done

echo "[OK] Ratings seeded"

# --------------------------------------------------
# Matches (4 confirmed)
# --------------------------------------------------

declare -A MATCHES
# format: "t1p1,t1p2:t2p1,t2p2:score1:score2:date"
MATCHES[001]="player-001,player-002:player-003,player-004:10:7:2026-03-05T14:00:00Z"
MATCHES[002]="player-003,player-001:player-002,player-004:10:8:2026-03-07T10:30:00Z"
MATCHES[003]="player-001,player-004:player-002,player-003:10:6:2026-03-09T16:00:00Z"
MATCHES[004]="player-002,player-004:player-001,player-003:10:9:2026-03-11T13:00:00Z"

for MID in 001 002 003 004; do
    IFS=':' read -r T1 T2 S1 S2 DATE <<< "${MATCHES[$MID]}"
    IFS=',' read -r T1P1 T1P2 <<< "$T1"
    IFS=',' read -r T2P1 T2P2 <<< "$T2"

    awslocal dynamodb put-item \
        --table-name foosball-league \
        --item "{
            \"pk\": {\"S\": \"$TENANT\"},
            \"sk\": {\"S\": \"MATCH#match-$MID\"},
            \"entity_type\": {\"S\": \"MATCH\"},
            \"match_id\": {\"S\": \"match-$MID\"},
            \"league_id\": {\"S\": \"league-001\"},
            \"team1_player_ids\": {\"L\": [{\"S\": \"$T1P1\"}, {\"S\": \"$T1P2\"}]},
            \"team2_player_ids\": {\"L\": [{\"S\": \"$T2P1\"}, {\"S\": \"$T2P2\"}]},
            \"team1_score\": {\"N\": \"$S1\"},
            \"team2_score\": {\"N\": \"$S2\"},
            \"status\": {\"S\": \"CONFIRMED\"},
            \"submitted_by\": {\"S\": \"$T1P1\"},
            \"confirmed_by\": {\"S\": \"$T2P1\"},
            \"elo_changes\": {\"M\": {}},
            \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
            \"gsi1_sk\": {\"S\": \"MATCH#${DATE}#match-$MID\"},
            \"created_at\": {\"S\": \"$DATE\"},
            \"updated_at\": {\"S\": \"$DATE\"}
        }"
done

echo "[OK] 4 matches seeded"

# --------------------------------------------------
# ELO History (15 points per player for chart)
# --------------------------------------------------

declare -A TRAJECTORIES
TRAJECTORIES[001]="1200 1220 1210 1240 1230 1255 1245 1270 1260 1275 1265 1280 1270 1285 1280"
TRAJECTORIES[002]="1200 1215 1225 1210 1230 1220 1235 1225 1240 1230 1225 1235 1220 1230 1220"
TRAJECTORIES[003]="1200 1185 1175 1190 1170 1160 1175 1155 1145 1155 1140 1130 1125 1135 1140"
TRAJECTORIES[004]="1200 1190 1200 1185 1175 1190 1170 1165 1175 1160 1155 1165 1150 1145 1160"

for ID in 001 002 003 004; do
    read -ra TRAJ <<< "${TRAJECTORIES[$ID]}"
    PREV=${TRAJ[0]}
    for i in $(seq 1 $((${#TRAJ[@]} - 1))); do
        ELO=${TRAJ[$i]}
        DELTA=$((ELO - PREV))
        PREV=$ELO
        DAY=$((i * 2))
        TS=$(printf "2026-02-%02dT%02d:00:00Z" $((DAY % 28 + 1)) $((10 + i % 8)))
        MATCH_ID=$(printf "seed%04x" $((RANDOM)))

        awslocal dynamodb put-item \
            --table-name foosball-league \
            --item "{
                \"pk\": {\"S\": \"$TENANT\"},
                \"sk\": {\"S\": \"ELOHIST#league-001#player-$ID#$TS\"},
                \"entity_type\": {\"S\": \"ELO_HISTORY\"},
                \"league_id\": {\"S\": \"league-001\"},
                \"player_id\": {\"S\": \"player-$ID\"},
                \"match_id\": {\"S\": \"$MATCH_ID\"},
                \"elo\": {\"N\": \"$ELO\"},
                \"delta\": {\"N\": \"$DELTA\"},
                \"created_at\": {\"S\": \"$TS\"},
                \"updated_at\": {\"S\": \"$TS\"}
            }"
    done
done

echo "[OK] ELO history seeded (15 points per player)"

# --------------------------------------------------
# Done
# --------------------------------------------------

echo ""
echo "============================================"
echo "  LocalStack Init Complete!"
echo "============================================"
echo ""
echo "  League: Office Champions 2v2"
echo "  Players: Marco, Luca, Giulia, Chiara"
echo ""
echo "  ┌──────────────────────────────────┐"
echo "  │  INVITE CODE:  $INVITE_CODE            │"
echo "  └──────────────────────────────────┘"
echo ""
echo "  1. Login with your Cognito account"
echo "  2. Register as 'Simi25'"
echo "  3. Click 'Join League' on Dashboard"
echo "  4. Enter code: $INVITE_CODE"
echo "  5. Play!"
echo ""
